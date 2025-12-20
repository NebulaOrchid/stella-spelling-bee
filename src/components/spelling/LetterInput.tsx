import { Button } from '../common/Button';
import { useSpelling } from '../../contexts/SpellingContext';

export function LetterInput() {
  const { currentAttempt, setCurrentAttempt, submitAttempt } = useSpelling();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow letters
    const value = e.target.value.replace(/[^a-zA-Z]/g, '');
    setCurrentAttempt(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAttempt.trim()) {
      submitAttempt();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div>
        <label htmlFor="spelling" className="block text-lg font-semibold mb-2 text-center">
          Or type your answer:
        </label>
        <p className="text-sm text-text-muted text-center mb-3">
          You can edit the voice transcription or type manually
        </p>
        <input
          id="spelling"
          type="text"
          value={currentAttempt}
          onChange={handleChange}
          className="w-full px-6 py-4 text-3xl text-center font-bold border-2 border-primary rounded-lg focus:outline-none focus:ring-4 focus:ring-primary/50 bg-surface text-text"
          placeholder="Type here..."
          autoComplete="off"
        />
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => setCurrentAttempt('')}
          disabled={!currentAttempt}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          type="submit"
          variant="success"
          size="md"
          disabled={!currentAttempt.trim()}
          className="flex-1"
        >
          Submit
        </Button>
      </div>
    </form>
  );
}
