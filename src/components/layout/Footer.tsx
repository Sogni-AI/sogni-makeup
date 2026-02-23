function Footer() {
  return (
    <footer className="border-t border-white/5 bg-gray-950/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-white/30">
            Powered by{' '}
            <a
              href="https://sogni.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/40 transition-colors hover:text-rose-400"
            >
              Sogni AI
            </a>
          </p>

          <nav className="flex items-center gap-6">
            <a
              href="https://sogni.ai/about"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 transition-colors hover:text-white/60"
            >
              About
            </a>
            <a
              href="https://sogni.ai/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 transition-colors hover:text-white/60"
            >
              Privacy
            </a>
            <a
              href="https://sogni.ai/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 transition-colors hover:text-white/60"
            >
              Terms
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
