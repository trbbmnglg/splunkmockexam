/**
 * scripts/sitemap-sample.js
 *
 * Fetches the help.splunk.com splunk-enterprise sitemap and samples
 * the first 200 URLs to reveal the actual URL structure and version format.
 *
 * Run: bun scripts/sitemap-sample.js
 */

async function main() {
  console.log('Fetching splunk-enterprise sitemap...\n');

  const res = await fetch('https://help.splunk.com/en/splunk-enterprise/sitemap.xml', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });

  const text = await res.text();
  const locs = [];
  const locRegex = /<loc>(https:\/\/help\.splunk\.com[^<]+)<\/loc>/g;
  let m;
  while ((m = locRegex.exec(text)) !== null) {
    locs.push(m[1].trim());
  }

  console.log(`Total URLs in sitemap: ${locs.length}\n`);

  // Sample first 50
  console.log('=== FIRST 50 URLs ===');
  locs.slice(0, 50).forEach(u => console.log(u));

  // Find URLs containing known topic keywords to understand structure
  console.log('\n=== URLs containing "license" ===');
  locs.filter(u => u.includes('license')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "dashboard" ===');
  locs.filter(u => u.includes('dashboard')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "search-manual" ===');
  locs.filter(u => u.includes('search-manual')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "data-model" ===');
  locs.filter(u => u.includes('data-model')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "sed" ===');
  locs.filter(u => u.includes('sed')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "multiline" ===');
  locs.filter(u => u.includes('multiline')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "drilldown" ===');
  locs.filter(u => u.includes('drilldown')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "form-input" ===');
  locs.filter(u => u.includes('form-input')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "scim" ===');
  locs.filter(u => u.includes('scim')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "capacity" ===');
  locs.filter(u => u.includes('capacity')).slice(0, 10).forEach(u => console.log(u));

  console.log('\n=== URLs containing "strftime" ===');
  locs.filter(u => u.includes('strftime')).slice(0, 10).forEach(u => console.log(u));

  // Extract unique version patterns
  const versionPattern = /\/(\d+\.\d+(?:\.\d+)?)\//g;
  const versions = new Set();
  for (const url of locs) {
    let vm;
    while ((vm = versionPattern.exec(url)) !== null) versions.add(vm[1]);
  }
  console.log('\n=== Version numbers found in sitemap URLs ===');
  console.log([...versions].sort().join(', '));

  // Extract unique section/book patterns  
  const sections = new Set();
  for (const url of locs) {
    const path = url.replace('https://help.splunk.com/en/splunk-enterprise/', '');
    const parts = path.split('/');
    if (parts.length >= 2) sections.add(`${parts[0]}/${parts[1]}`);
  }
  console.log('\n=== Unique section/book combinations ===');
  [...sections].sort().forEach(s => console.log(`  ${s}`));
}

main().catch(console.error);
