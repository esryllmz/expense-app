import { AppRouter } from "../src/routes/AppRouter";

/**
 * App: Artık sadece yönlendirme katmanından sorumludur.
 * Tüm sağlayıcılar AppProvider üzerinden yönetilmektedir.
 */
function App() {
  return (
    <AppRouter />
  );
}

export default App;