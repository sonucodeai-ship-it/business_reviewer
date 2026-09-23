import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import FirstPage from "./pages/FirstPage/first_page";
import ReviewPage from "./pages/ReviewPage/review_page";


function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<FirstPage />}
        />

        <Route
          path="/review"
          element={<ReviewPage />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;