function Footer() {
  return (
    <footer className="border-t border-primary-400/[0.06] bg-surface-950/50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Decorative Art Deco line */}
        <div className="deco-line mx-auto mb-6 w-24" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs tracking-wide text-white/25">
            Powered by{' '}
            <a
              href="https://sogni.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/35 transition-colors hover:text-primary-300"
            >
              Sogni AI
            </a>
          </p>

          <nav className="flex items-center gap-6">
            <a
              href="https://www.sogni.ai/supernet"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wide text-white/25 transition-colors hover:text-white/50"
            >
              About
            </a>
            <a
              href="https://www.sogni.ai/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wide text-white/25 transition-colors hover:text-white/50"
            >
              Privacy
            </a>
            <a
              href="https://www.sogni.ai/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-wide text-white/25 transition-colors hover:text-white/50"
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
