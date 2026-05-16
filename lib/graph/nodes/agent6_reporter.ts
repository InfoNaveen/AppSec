/**
 * Agent 6 — Reporting + Notification Agent
 * Generates JSON/PDF report, uploads to Supabase Storage, sends Discord notification,
 * and opens GitHub PR with patched files.
 */
import { AgentState } from '../state';
import { startSpan, endSpan, logToolCall, endTrace } from '../../omium';
import { commitToGitHub, extractRepoInfo } from '../../github';
import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export async function agent6Reporter(state: AgentState): Promise<Partial<AgentState>> {
  const spanId = await startSpan(state.omiumTraceId, 'agent6_reporter', {
    agentName: 'Reporting + Notification Agent',
  });

  try {
    console.log('[Agent6] Generating report...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const criticalCount = state.triageResults.filter(f => f.severity === 'critical').length;
    const highCount = state.triageResults.filter(f => f.severity === 'high').length;
    const mediumCount = state.triageResults.filter(f => f.severity === 'medium').length;
    const lowCount = state.triageResults.filter(f => f.severity === 'low').length;
    const patchedCount = state.triageResults.filter(f => f.status === 'patched').length;
    const falsePositiveCount = state.triageResults.filter(f => f.status === 'false_positive').length;

    // 1. Build JSON report
    const jsonReport = {
      scanId: state.scanId,
      repoUrl: state.repoUrl,
      language: state.language,
      scannedAt: new Date().toISOString(),
      summary: {
        total: state.triageResults.length,
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        patched: patchedCount,
        falsePositives: falsePositiveCount,
        hardeningApplied: state.hardeningApplied,
      },
      findings: state.triageResults,
      patches: state.patches,
      hardening: state.hardeningApplied,
    };

    // 2. Generate PDF
    const tmpDir = path.join(process.env.TEMP || process.env.TMP || '/tmp', state.scanId);
    fs.mkdirSync(tmpDir, { recursive: true });

    const pdfPath = path.join(tmpDir, 'report.pdf');
    const jsonPath = path.join(tmpDir, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));

    const t0Pdf = Date.now();
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Page 1: Header + Summary
      doc.fontSize(24).text('SecureForge AI', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(12).fillColor('#666').text('Autonomous Security Assessment Report', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(10).fillColor('#333')
        .text(`Repository: ${state.repoUrl}`)
        .text(`Language: ${state.language}`)
        .text(`Scan Date: ${jsonReport.scannedAt}`)
        .text(`Scan ID: ${state.scanId}`);
      doc.moveDown(1);

      // Severity summary
      doc.fontSize(14).fillColor('#000').text('Severity Summary');
      doc.moveDown(0.5);
      doc.fontSize(10)
        .fillColor('#dc2626').text(`Critical: ${criticalCount}`, { continued: true })
        .fillColor('#333').text('  |  ', { continued: true })
        .fillColor('#ea580c').text(`High: ${highCount}`, { continued: true })
        .fillColor('#333').text('  |  ', { continued: true })
        .fillColor('#ca8a04').text(`Medium: ${mediumCount}`, { continued: true })
        .fillColor('#333').text('  |  ', { continued: true })
        .fillColor('#16a34a').text(`Low: ${lowCount}`);
      doc.moveDown(0.3);
      doc.fillColor('#333')
        .text(`Patched: ${patchedCount}  |  False Positives: ${falsePositiveCount}`);
      doc.moveDown(1);

      // Page 2+: Findings details
      const critHighFindings = state.triageResults.filter(
        f => f.severity === 'critical' || f.severity === 'high'
      );

      for (const finding of critHighFindings) {
        if (doc.y > 650) doc.addPage();

        doc.fontSize(12).fillColor('#000')
          .text(`[${finding.severity.toUpperCase()}] ${finding.ruleId}`);
        doc.fontSize(9).fillColor('#666')
          .text(`${finding.filePath}:${finding.lineStart}-${finding.lineEnd}`);
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor('#333').text(finding.description);

        if (finding.vulnerableCode) {
          doc.moveDown(0.3);
          doc.fontSize(8).fillColor('#999').text('Vulnerable Code:');
          doc.font('Courier').fontSize(8).fillColor('#333')
            .text(finding.vulnerableCode.slice(0, 500));
          doc.font('Helvetica');
        }

        doc.moveDown(0.3);
        doc.fontSize(9).fillColor('#555')
          .text(`Rationale: ${finding.exploitabilityRationale}`);

        // Show patch if available
        const patch = state.patches.find(p => p.findingId === finding.id);
        if (patch) {
          doc.moveDown(0.3);
          doc.fontSize(8).fillColor('#16a34a').text('✓ Patched Code:');
          doc.font('Courier').fontSize(8).fillColor('#333')
            .text(patch.patchedCode.slice(0, 500));
          doc.font('Helvetica');
        }

        if (finding.advisoryUrl) {
          doc.moveDown(0.2);
          doc.fontSize(8).fillColor('#2563eb').text(`Advisory: ${finding.advisoryUrl}`);
        }

        doc.moveDown(1);
      }

      // Final page: Hardening
      if (state.hardeningApplied.length > 0) {
        if (doc.y > 600) doc.addPage();
        doc.fontSize(14).fillColor('#000').text('Security Hardening Applied');
        doc.moveDown(0.5);
        for (const measure of state.hardeningApplied) {
          doc.fontSize(10).fillColor('#333').text(`• ${measure}`);
        }
      }

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    await logToolCall(spanId, {
      name: 'pdf_generate',
      input: { scanId: state.scanId },
      output: { path: pdfPath },
      durationMs: Date.now() - t0Pdf,
    });

    // 3. Upload to Supabase Storage
    let pdfUrl = '';
    const t0Upload = Date.now();
    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      const jsonBuffer = fs.readFileSync(jsonPath);

      await supabase.storage.from('reports').upload(
        `${state.scanId}/report.pdf`, pdfBuffer,
        { contentType: 'application/pdf', upsert: true }
      );
      await supabase.storage.from('reports').upload(
        `${state.scanId}/report.json`, jsonBuffer,
        { contentType: 'application/json', upsert: true }
      );

      const { data: urlData } = supabase.storage.from('reports')
        .getPublicUrl(`${state.scanId}/report.pdf`);
      pdfUrl = urlData?.publicUrl || '';

      await logToolCall(spanId, {
        name: 'supabase_storage_upload',
        input: { scanId: state.scanId },
        output: { pdfUrl },
        durationMs: Date.now() - t0Upload,
      });
    } catch (err: any) {
      console.error('[Agent6] Supabase storage upload failed:', err.message);
    }

    // 4. Discord notification
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
      const t0Discord = Date.now();
      try {
        const color = criticalCount > 0 ? 0xFF0000 : highCount > 0 ? 0xFF8800 : 0x00FF00;
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🛡️ SecureForge AI — Scan Complete',
              color,
              fields: [
                { name: 'Repository', value: state.repoUrl, inline: false },
                { name: 'Critical', value: String(criticalCount), inline: true },
                { name: 'High', value: String(highCount), inline: true },
                { name: 'Patched', value: String(patchedCount), inline: true },
                ...(pdfUrl ? [{ name: 'Report', value: `[View PDF](${pdfUrl})`, inline: false }] : []),
              ],
            }],
          }),
        });
        await logToolCall(spanId, {
          name: 'discord_notify',
          input: { webhookUrl: '***' },
          output: { sent: true },
          durationMs: Date.now() - t0Discord,
        });
      } catch (err: any) {
        console.error('[Agent6] Discord notification failed:', err.message);
      }
    } else {
      console.log('[Agent6] Discord skipped — no webhook URL configured');
    }

    // 5. GitHub PR
    let prUrl: string | null = null;
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken && state.patches.length > 0) {
      const t0Pr = Date.now();
      try {
        const repoInfo = extractRepoInfo(state.repoUrl);
        if (repoInfo) {
          const patchedDir = state.repoPath + '_patched';
          const patchedFiles: Array<{ path: string; content: string }> = [];

          // Collect all patched files
          if (fs.existsSync(patchedDir)) {
            const collectFiles = (dir: string, base: string) => {
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                  collectFiles(fullPath, base);
                } else {
                  const relPath = path.relative(base, fullPath);
                  const content = fs.readFileSync(fullPath, 'utf-8');
                  patchedFiles.push({ path: relPath, content });
                }
              }
            };
            collectFiles(patchedDir, patchedDir);
          }

          if (patchedFiles.length > 0) {
            const branch = `secureforge/scan-${state.scanId.slice(0, 8)}`;
            const result = await commitToGitHub({
              token: githubToken,
              owner: repoInfo.owner,
              repo: repoInfo.repo,
              branch,
              message: `🛡️ SecureForge AI: ${criticalCount} critical, ${highCount} high vulnerabilities patched`,
              files: patchedFiles,
            });
            prUrl = result.prUrl || null;
            console.log(`[Agent6] ✅ GitHub PR created: ${prUrl}`);

            await logToolCall(spanId, {
              name: 'github_pr_create',
              input: { branch },
              output: { prUrl },
              durationMs: Date.now() - t0Pr,
            });
          }
        }
      } catch (err: any) {
        console.error('[Agent6] GitHub PR creation failed:', err.message);
      }
    } else if (!githubToken) {
      console.log('[Agent6] GitHub PR skipped — no token');
    }

    // 6. Update Supabase scan row
    await supabase.from('scans').update({
      status: 'completed',
      current_agent: 'agent6_reporter',
      report_url: pdfUrl || null,
      pr_url: prUrl,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', state.scanId);

    // 7. Persist findings + patches to Supabase
    if (state.triageResults.length > 0) {
      const findingRows = state.triageResults.map(f => ({
        scan_id: state.scanId,
        rule_id: f.ruleId,
        severity: f.severity,
        file_path: f.filePath,
        line_start: f.lineStart,
        line_end: f.lineEnd,
        description: f.description,
        vulnerable_code: f.vulnerableCode,
        exploitability_rationale: f.exploitabilityRationale,
        cve_id: f.cveId || null,
        advisory_url: f.advisoryUrl || null,
        advisory_note: f.advisoryNote || null,
        status: f.status,
      }));
      await supabase.from('findings').insert(findingRows);
    }

    if (state.patches.length > 0) {
      const patchRows = state.patches.map(p => ({
        scan_id: state.scanId,
        finding_id: null, // Could cross-reference by findingId if needed
        original_code: p.originalCode,
        patched_code: p.patchedCode,
        file_path: p.filePath,
        patch_type: p.patchType,
        applied: true,
      }));
      await supabase.from('patches').insert(patchRows);
    }

    // 8. End Omium trace
    await endSpan(spanId, {
      status: 'success',
      output: { reportUrl: pdfUrl, prUrl, findingsCount: state.triageResults.length },
    });
    await endTrace(state.omiumTraceId, {
      status: 'completed',
      findingsCount: state.triageResults.length,
      patchesCount: state.patches.length,
      hardeningCount: state.hardeningApplied.length,
    });

    console.log(`[Agent6] ✅ Complete — report generated, ${state.triageResults.length} findings, ${state.patches.length} patches persisted`);
    return {
      reportPath: pdfUrl || pdfPath,
      prUrl,
      status: 'completed',
      currentAgent: 'agent6_reporter',
    };
  } catch (err: any) {
    await endSpan(spanId, { status: 'failed', errorMessage: err.message });
    await endTrace(state.omiumTraceId, {
      status: 'failed',
      findingsCount: state.triageResults.length,
      patchesCount: state.patches.length,
      hardeningCount: state.hardeningApplied.length,
    });
    return {
      status: 'failed',
      errors: [...state.errors, `agent6_reporter: ${err.message}`],
      currentAgent: 'agent6_reporter',
    };
  }
}
