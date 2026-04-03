import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Main from "./Component/Main.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}

export default App;