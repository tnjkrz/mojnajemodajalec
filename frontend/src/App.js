// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import ReviewNew from "./pages/ReviewNew";
import Footer from "./components/Footer";
import PropertyShow from "./pages/PropertyShow";



export default function App() {
  // create/restore anonymous session
  useEffect(() => {
    fetch("http://localhost:8210/api/session", {
      credentials: "include", // IMPORTANT so cookie is stored/sent
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />


        <Route path="/reviews/new" element={<ReviewNew />} />
        <Route path="/properties/:id" element={<PropertyShow />} />

        
  
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
