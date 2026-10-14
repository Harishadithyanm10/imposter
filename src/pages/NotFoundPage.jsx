import Button from '../components/common/Button.jsx';
import Logo from '../components/common/Logo.jsx';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <div className="mb-6 flex justify-center"><Logo /></div>
        <p className="font-display text-7xl font-extrabold text-hot-500">404</p>
        <h1 className="mt-2 text-2xl font-bold">This page vanished</h1>
        <p className="mt-2 text-ink-300">It might be an old link, or the imposter took it.</p>
        <Button to="/" className="mt-6">Back to home</Button>
      </div>
    </div>
  );
}
