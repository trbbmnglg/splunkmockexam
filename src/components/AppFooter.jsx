export default function AppFooter({ gameState }) {
  if (gameState !== 'menu' && gameState !== 'results') return null;
  return (
    <footer className="text-center text-xs text-slate-400 py-6 mt-4">
      Not affiliated with or endorsed by Splunk Inc.
    </footer>
  );
}
