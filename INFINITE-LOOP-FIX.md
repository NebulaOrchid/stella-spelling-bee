# Infinite Loop Fix 🔧

Fixed the bug causing repeated word pronunciation ("fish", "fish", "fish"...)

## The Problem

**Symptom:**
- Word pronounces repeatedly without stopping
- "fish", "fish", "fish" playing over and over
- User never gets a chance to spell

**Root Cause:**
Infinite loop in the useEffect dependencies

## The Bug Explained

### Before (Broken Code):

```typescript
const speakWord = useCallback(async () => {
  if (isPlaying) return;
  setIsPlaying(true);
  // ... play audio
  setIsPlaying(false);
}, [word.word, isPlaying]); // ❌ isPlaying in dependencies

useEffect(() => {
  speakWord();
  onPronunciationComplete();
}, [word.id, speakWord, onPronunciationComplete]); // ❌ speakWord in dependencies
```

### The Infinite Loop:

1. useEffect runs → calls `speakWord()`
2. `speakWord()` sets `isPlaying = true`
3. **`isPlaying` changes** → `speakWord` is recreated (new reference)
4. **`speakWord` changes** → useEffect detects dependency change
5. **useEffect runs again** → calls `speakWord()` again!
6. `speakWord()` sets `isPlaying = false` when done
7. **`isPlaying` changes again** → `speakWord` recreated again
8. **Loop continues forever** → "fish", "fish", "fish"...

## The Fix

### After (Fixed Code):

```typescript
const hasAutoPlayedRef = useRef<string | null>(null);

useEffect(() => {
  // Check if already played THIS word
  if (hasAutoPlayedRef.current === word.id) {
    return; // ✅ Exit early if already played
  }

  const autoPlayWord = async () => {
    hasAutoPlayedRef.current = word.id; // ✅ Mark as played FIRST

    setIsPlaying(true);
    // ... play audio
    setIsPlaying(false);

    onPronunciationComplete();
  };

  autoPlayWord();
}, [word.id]); // ✅ ONLY depend on word.id
```

### Key Changes:

1. **useRef instead of state** - `hasAutoPlayedRef` doesn't cause re-renders
2. **Early exit check** - If word already played, return immediately
3. **Mark BEFORE playing** - Set flag before async operation starts
4. **Simplified dependencies** - Only `word.id` (which changes when new word loads)
5. **Removed problematic deps** - No `speakWord`, `isPlaying`, or `onPronunciationComplete` in deps

## Why This Works

### useRef Benefits:
- ✅ Persists across re-renders
- ✅ Doesn't trigger re-renders when updated
- ✅ Perfect for tracking "has this happened" flags

### Simplified Dependencies:
- ✅ Only re-run when `word.id` actually changes (new word)
- ✅ Ignore state changes like `isPlaying`
- ✅ No dependency chain causing loops

### Early Exit Pattern:
```typescript
if (hasAutoPlayedRef.current === word.id) {
  return; // Already played, don't play again
}
```

## The Correct Flow Now

1. **New word loads** → `word.id` changes
2. **useEffect triggers** → Checks `hasAutoPlayedRef`
3. **First time?** → Yes, ref is null or different word ID
4. **Mark as played** → `hasAutoPlayedRef.current = word.id`
5. **Play audio** → TTS pronunciation
6. **Audio completes** → Call `onPronunciationComplete()`
7. **State changes happen** → `isPlaying` toggles, etc.
8. **Component re-renders** → useEffect runs again
9. **Check ref** → "Already played this word!" → Exit early ✅
10. **No loop!** → Only plays once per word

## Edge Cases Handled

### 1. Fast Re-renders
- Even if component re-renders 100 times
- Ref check prevents re-playing
- Only plays once per unique `word.id`

### 2. Same Word Appearing Later
- If "fish" appears again later in the game
- It will have a DIFFERENT `word.id` (new Word object)
- Will play again (correct behavior)

### 3. Manual "Click to Hear Again"
- Separate `speakWord()` function
- Not affected by the ref check
- Can replay as many times as needed

### 4. Component Unmount/Remount
- Ref persists during component lifetime
- If component unmounts and remounts with same word
- Ref is reset → Will play again (correct behavior)

## Testing

✅ Word pronounces exactly ONCE when loaded
✅ No repeated "fish, fish, fish"
✅ User gets time to spell after pronunciation
✅ Recording auto-starts after pronunciation
✅ Manual "Click to hear again" still works
✅ Next word plays correctly (different ID)

## Files Modified

**`src/components/spelling/WordDisplay.tsx`**
- Added `hasAutoPlayedRef` to track played words
- Simplified useEffect to only depend on `word.id`
- Early exit if word already played
- Removed `useCallback` from auto-play logic
- Kept manual `speakWord()` separate

## Lessons Learned

### Don't Put Changing State in useCallback Dependencies
❌ Bad:
```typescript
const fn = useCallback(() => {}, [stateValue]);
useEffect(() => { fn() }, [fn]);
```

✅ Good:
```typescript
useEffect(() => {
  // inline logic or call function directly
}, [specificValue]);
```

### Use Refs for "Has This Happened" Flags
❌ Bad:
```typescript
const [hasPlayed, setHasPlayed] = useState(false);
// Causes re-renders
```

✅ Good:
```typescript
const hasPlayedRef = useRef(false);
// No re-renders
```

### Keep Dependencies Minimal
❌ Bad:
```typescript
useEffect(() => {}, [dep1, dep2, dep3, callback]);
```

✅ Good:
```typescript
useEffect(() => {}, [onlyWhatChangesTheIntent]);
```

## Summary

The infinite loop was caused by:
1. `isPlaying` state triggering `speakWord` recreation
2. `speakWord` change triggering useEffect
3. useEffect calling `speakWord` again
4. Loop continues forever

Fixed by:
1. Using `useRef` to track played words
2. Early exit if already played
3. Only depending on `word.id` in useEffect
4. Removing problematic dependency chains

**Result:** Word pronounces exactly once, user gets full time to spell! ✅
