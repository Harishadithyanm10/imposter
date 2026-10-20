import Button from '../common/Button.jsx';

export default function GoogleButton({ onClick, loading, large }) {
  return (
    <Button type="button" variant="secondary" size={large ? 'lg' : 'md'} className="w-full" onClick={onClick} loading={loading}>
      <svg viewBox="0 0 24 24" className={large ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden>
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.7 4-5.5 4a6.1 6.1 0 1 1 0-12.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6A9.8 9.8 0 0 0 12 2.2a9.8 9.8 0 1 0 0 19.6c5.7 0 9.4-4 9.4-9.6 0-.6-.1-1.1-.2-1.6H12z" />
      </svg>
      Continue with Google
    </Button>
  );
}
