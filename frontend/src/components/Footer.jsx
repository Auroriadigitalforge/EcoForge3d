/**
 * Footer — simple attribution bar.
 */
export default function Footer() {
  return (
    <footer className="w-full border-t border-eco-800/80 bg-eco-950/65 backdrop-blur-md px-6 py-3 text-center">
      <p className="text-sm text-eco-500">
        <span className="font-semibold text-eco-300">EcoForge 3D</span> &mdash; Hackathon MVP &mdash; Built with{' '}
        <span className="text-eco-400 font-medium">React</span>,{' '}
        <span className="text-eco-400 font-medium">Three.js</span> &amp;{' '}
        <span className="text-eco-400 font-medium">Gemini AI</span>
      </p>
    </footer>
  );
}
