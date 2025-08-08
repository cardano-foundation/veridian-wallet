#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// HTML template for the audit report
const generateHTMLReport = (auditData, scriptOutput = '') => {
  const timestamp = new Date().toISOString();
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Dependency Security Audit Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header .timestamp {
            opacity: 0.9;
            margin-top: 10px;
        }
        .summary {
            padding: 30px;
            border-bottom: 1px solid #eee;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .summary-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #007bff;
        }
        .summary-card.critical {
            border-left-color: #dc3545;
            background: #fff5f5;
        }
        .summary-card.warning {
            border-left-color: #ffc107;
            background: #fffbf0;
        }
        .summary-card.success {
            border-left-color: #28a745;
            background: #f0fff4;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            font-size: 2em;
            color: #333;
        }
        .summary-card p {
            margin: 0;
            color: #666;
            font-weight: 500;
        }
        .content {
            padding: 30px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .vulnerability-item {
            background: #fff;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
            border-left: 4px solid #dc3545;
        }
        .vulnerability-item.warning {
            border-left-color: #ffc107;
        }
        .vulnerability-item.info {
            border-left-color: #17a2b8;
        }
        .vulnerability-item h4 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .vulnerability-item p {
            margin: 5px 0;
            color: #666;
        }
        .severity {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .severity.critical {
            background: #dc3545;
            color: white;
        }
        .severity.high {
            background: #fd7e14;
            color: white;
        }
        .severity.moderate {
            background: #ffc107;
            color: #212529;
        }
        .severity.low {
            background: #28a745;
            color: white;
        }
        .recommendations {
            background: #e3f2fd;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }
        .recommendations h3 {
            color: #1976d2;
            margin-top: 0;
        }
        .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        .recommendations li {
            margin-bottom: 8px;
            color: #333;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            border-top: 1px solid #eee;
        }
        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
        }
        .status-indicator.pass {
            background: #28a745;
        }
        .status-indicator.fail {
            background: #dc3545;
        }
        .status-indicator.warning {
            background: #ffc107;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Mobile Dependency Security Audit</h1>
            <div class="timestamp">Generated on ${timestamp}</div>
        </div>
        
        <div class="summary">
            <h2>📊 Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card ${auditData.npmVulnerabilities > 0 ? 'critical' : 'success'}">
                    <h3>${auditData.npmVulnerabilities}</h3>
                    <p>NPM Vulnerabilities</p>
                </div>
                <div class="summary-card ${auditData.iosIssues > 0 ? 'warning' : 'success'}">
                    <h3>${auditData.iosIssues}</h3>
                    <p>iOS Issues</p>
                </div>
                <div class="summary-card ${auditData.androidIssues > 0 ? 'warning' : 'success'}">
                    <h3>${auditData.androidIssues}</h3>
                    <p>Android Issues</p>
                </div>
                <div class="summary-card ${auditData.sensitiveFiles > 0 ? 'critical' : 'success'}">
                    <h3>${auditData.sensitiveFiles}</h3>
                    <p>Sensitive Files</p>
                </div>
            </div>
        </div>
        
        <div class="content">
            ${auditData.npmVulnerabilities > 0 ? `
            <div class="section">
                <h2>📦 NPM Dependencies</h2>
                ${auditData.npmVulns.map(vuln => `
                <div class="vulnerability-item">
                    <h4>${vuln.package}</h4>
                    <p><strong>Severity:</strong> <span class="severity ${vuln.severity}">${vuln.severity}</span></p>
                    ${vuln.description ? `<p><strong>Issue:</strong> ${vuln.description}</p>` : ''}
                    ${vuln.recommendation ? `<p><strong>Fix:</strong> ${vuln.recommendation}</p>` : ''}
                    ${vuln.details.length > 0 ? `
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        <strong>Details:</strong>
                        <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                            ${vuln.details.map(detail => `<li>${detail}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${auditData.outdatedPackages.length > 0 ? `
            <div class="section">
                <h2>🔄 Outdated Packages</h2>
                <div class="vulnerability-item warning">
                    <h4>Packages with Available Updates</h4>
                    <p><strong>Count:</strong> ${auditData.outdatedPackages.length} packages have updates available</p>
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                        <strong>Update Command:</strong> <code>npx npm-check-updates -u && npm install</code>
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            ${auditData.outdatedPackages.slice(0, 10).map(pkg => 
                                `<li><strong>${pkg.package}</strong>: ${pkg.current} → ${pkg.latest}</li>`
                            ).join('')}
                            ${auditData.outdatedPackages.length > 10 ? `<li>... and ${auditData.outdatedPackages.length - 10} more packages</li>` : ''}
                        </ul>
                    </div>
                </div>
            </div>
            ` : ''}
            
            ${auditData.iosIssues > 0 ? `
            <div class="section">
                <h2>🍎 iOS Dependencies</h2>
                ${auditData.iosVulns.map(vuln => `
                <div class="vulnerability-item ${vuln.severity === 'warning' ? 'warning' : ''}">
                    <h4>${vuln.library}</h4>
                    <p><strong>Issue:</strong> ${vuln.description}</p>
                    <p><strong>Action:</strong> ${vuln.action}</p>
                </div>
                `).join('')}
                ${scriptOutput.includes('Some iOS dependencies may be outdated') ? `
                <div class="vulnerability-item warning">
                    <h4>iOS Dependencies Outdated</h4>
                    <p><strong>Issue:</strong> Some iOS dependencies may be outdated</p>
                    <p><strong>Action:</strong> Run <code>cd ios/App && pod outdated</code> to check for updates</p>
                    <p><strong>Update Command:</strong> <code>cd ios/App && pod update</code></p>
                </div>
                ` : ''}
            </div>
            ` : ''}
            
            ${auditData.androidIssues > 0 ? `
            <div class="section">
                <h2>🤖 Android Dependencies</h2>
                ${auditData.androidVulns.map(vuln => `
                <div class="vulnerability-item ${vuln.severity === 'warning' ? 'warning' : ''}">
                    <h4>${vuln.library}</h4>
                    <p><strong>Issue:</strong> ${vuln.description}</p>
                    <p><strong>Action:</strong> ${vuln.action}</p>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${auditData.sensitiveFiles > 0 ? `
            <div class="section">
                <h2>🔐 Sensitive Files</h2>
                ${auditData.sensitiveFilesList.map(file => `
                <div class="vulnerability-item critical">
                    <h4>${file.path}</h4>
                    <p><strong>Type:</strong> ${file.type}</p>
                    <p><strong>Risk:</strong> ${file.risk}</p>
                    <p><strong>Action:</strong> ${file.action}</p>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div class="recommendations">
                <h3>💡 Comprehensive Recommendations</h3>
                <ul>
                    ${auditData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
                
                <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 6px; border-left: 4px solid #28a745;">
                    <h4 style="margin: 0 0 10px 0; color: #155724;">🚀 Immediate Actions</h4>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${auditData.npmVulnerabilities > 0 ? '<li>Run <code>npm audit fix</code> to fix non-breaking vulnerabilities</li>' : ''}
                        ${auditData.outdatedPackages.length > 0 ? '<li>Update packages with <code>npx npm-check-updates -u && npm install</code></li>' : ''}
                        ${auditData.iosIssues > 0 ? '<li>Update iOS dependencies with <code>cd ios/App && pod update</code></li>' : ''}
                        ${auditData.sensitiveFiles > 0 ? '<li>Remove sensitive files from repository immediately</li>' : ''}
                        <li>Review this report with your security team</li>
                        <li>Schedule regular security audits</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>This report was generated automatically by the Mobile Dependency Security Audit system.</p>
            <p>For more information, see the project documentation.</p>
        </div>
    </div>
</body>
</html>`;
};

// Parse audit results from the script output
const parseAuditResults = (scriptOutput) => {
  const results = {
    npmVulnerabilities: 0,
    npmVulns: [],
    iosIssues: 0,
    iosVulns: [],
    androidIssues: 0,
    androidVulns: [],
    sensitiveFiles: 0,
    sensitiveFilesList: [],
    outdatedPackages: [],
    recommendations: []
  };
  
  // Parse NPM vulnerabilities
  const npmAuditMatch = scriptOutput.match(/NPM dependencies: (\d+) vulnerabilities/);
  if (npmAuditMatch) {
    results.npmVulnerabilities = parseInt(npmAuditMatch[1]);
  }
  
  // Parse detailed NPM vulnerabilities from audit output
  const npmAuditSection = scriptOutput.match(/# npm audit report([\s\S]*?)(?=\n\n|$)/);
  if (npmAuditSection) {
    const auditLines = npmAuditSection[1].split('\n');
    let currentVuln = null;
    
    for (const line of auditLines) {
      if (line.includes('Severity:')) {
        if (currentVuln) {
          results.npmVulns.push(currentVuln);
        }
        const severity = line.match(/Severity: (\w+)/)?.[1] || 'unknown';
        const packageName = line.match(/^(\S+)/)?.[1] || 'unknown';
        currentVuln = {
          package: packageName,
          severity: severity.toLowerCase(),
          description: '',
          recommendation: '',
          details: []
        };
      } else if (currentVuln && line.trim()) {
        if (line.includes('fix available via')) {
          currentVuln.recommendation = line.trim();
        } else if (!line.startsWith('node_modules') && !line.startsWith('Depends on')) {
          currentVuln.details.push(line.trim());
        }
      }
    }
    if (currentVuln) {
      results.npmVulns.push(currentVuln);
    }
  }
  
  // Parse iOS issues
  const iosWarnings = (scriptOutput.match(/Found potentially vulnerable iOS library:/g) || []).length;
  const iosOutdated = scriptOutput.includes('Some iOS dependencies may be outdated') ? 1 : 0;
  results.iosIssues = iosWarnings + iosOutdated;
  
  // Parse specific iOS vulnerabilities
  const iosVulnMatches = scriptOutput.match(/Found potentially vulnerable iOS library: ([^\n]+)/g);
  if (iosVulnMatches) {
    results.iosVulns = iosVulnMatches.map(match => {
      const library = match.replace('Found potentially vulnerable iOS library: ', '');
      return {
        library: library,
        severity: 'warning',
        description: 'Known vulnerable iOS library detected',
        action: 'Update to latest version or consider alternative library'
      };
    });
  }
  
  // Parse Android issues
  const androidWarnings = (scriptOutput.match(/Found potentially vulnerable Android library:/g) || []).length;
  const androidConfigIssues = (scriptOutput.match(/Found (debuggable|allowBackup)=true/g) || []).length;
  results.androidIssues = androidWarnings + androidConfigIssues;
  
  // Parse specific Android vulnerabilities
  const androidVulnMatches = scriptOutput.match(/Found potentially vulnerable Android library: ([^\n]+)/g);
  if (androidVulnMatches) {
    results.androidVulns = androidVulnMatches.map(match => {
      const library = match.replace('Found potentially vulnerable Android library: ', '');
      return {
        library: library,
        severity: 'warning',
        description: 'Known vulnerable Android library detected',
        action: 'Update to latest version or consider alternative library'
      };
    });
  }
  
  // Parse Android configuration issues
  if (scriptOutput.includes('Found debuggable=true in build.gradle')) {
    results.androidVulns.push({
      library: 'build.gradle',
      severity: 'critical',
      description: 'Debug mode enabled in production build',
      action: 'Remove debuggable=true from build.gradle for production builds'
    });
  }
  
  if (scriptOutput.includes('Found allowBackup=true in build.gradle')) {
    results.androidVulns.push({
      library: 'build.gradle',
      severity: 'warning',
      description: 'Allow backup enabled - potential data exposure risk',
      action: 'Review allowBackup setting for security implications'
    });
  }
  
  // Parse sensitive files
  const sensitiveFileMatches = scriptOutput.match(/Found sensitive files matching pattern: ([^\n]+)/g);
  if (sensitiveFileMatches) {
    results.sensitiveFiles = sensitiveFileMatches.length;
    results.sensitiveFilesList = sensitiveFileMatches.map(match => {
      const pattern = match.replace('Found sensitive files matching pattern: ', '');
      return {
        path: pattern,
        type: 'Sensitive Configuration',
        risk: 'Contains sensitive information that should not be in version control',
        action: 'Remove from repository and add to .gitignore'
      };
    });
  }
  
  // Parse outdated packages
  const outdatedSection = scriptOutput.match(/Patch\s+Backwards-compatible bug fixes([\s\S]*?)(?=\n\n|$)/);
  if (outdatedSection) {
    const lines = outdatedSection[1].split('\n');
    results.outdatedPackages = lines
      .filter(line => line.includes('→'))
      .map(line => {
        const match = line.match(/^\s*([^\s]+)\s+([^\s]+)\s+→\s+([^\s]+)/);
        if (match) {
          return {
            package: match[1],
            current: match[2],
            latest: match[3],
            type: 'patch'
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  
  // Generate comprehensive recommendations
  results.recommendations = [
    'Regularly update Capacitor and mobile plugins to latest versions',
    'Monitor security advisories for mobile dependencies',
    'Consider using dependency scanning tools in CI/CD',
    'Review and update .nsprc for mobile-specific vulnerabilities',
    'Install cocoapods-audit for enhanced iOS vulnerability scanning',
    'Consider using OWASP Dependency Check for Android in local development'
  ];
  
  if (results.npmVulnerabilities > 0) {
    results.recommendations.push('Run npm audit fix to address non-breaking vulnerabilities');
    results.recommendations.push('Review breaking changes before running npm audit fix --force');
  }
  
  if (results.iosIssues > 0) {
    results.recommendations.push('Update iOS dependencies with pod update');
    results.recommendations.push('Consider using Swift Package Manager for better dependency management');
  }
  
  if (results.androidIssues > 0) {
    results.recommendations.push('Review Android build configuration for security settings');
    results.recommendations.push('Consider using AndroidX instead of Support Library');
  }
  
  if (results.sensitiveFiles > 0) {
    results.recommendations.push('Remove sensitive files from version control immediately');
    results.recommendations.push('Use environment variables or secure storage for sensitive data');
  }
  
  return results;
};

// Main execution
const main = () => {
  try {
    // Read the audit script output from a file or stdin
    const auditOutput = fs.readFileSync('audit-output.txt', 'utf8');
    const auditData = parseAuditResults(auditOutput);
    
    // Generate HTML report
    const htmlReport = generateHTMLReport(auditData, auditOutput);
    
    // Write the report to a file
    fs.writeFileSync('mobile-security-audit-report.html', htmlReport);
    
    console.log('✅ HTML report generated: mobile-security-audit-report.html');
    console.log(`📊 Summary: ${auditData.npmVulnerabilities} NPM vulns, ${auditData.iosIssues} iOS issues, ${auditData.androidIssues} Android issues, ${auditData.sensitiveFiles} sensitive files`);
    
  } catch (error) {
    console.error('❌ Error generating HTML report:', error.message);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateHTMLReport, parseAuditResults };
