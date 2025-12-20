import { SpellingProvider } from './contexts/SpellingContext';
import { SpellingGame } from './components/spelling/SpellingGame';

function App() {
  return (
    <SpellingProvider>
      <SpellingGame />
    </SpellingProvider>
  );
}

export default App;
