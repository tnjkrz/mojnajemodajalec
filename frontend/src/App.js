// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import ReviewNew from "./pages/ReviewNew";
import Footer from "./components/Footer";
import PropertyShow from "./pages/PropertyShow";
import Admin from "./pages/Admin";
import AboutUs from "./pages/AboutUs";
import Rules from "./pages/Rules";
import { api } from "./api"; // 

export default function App() {
  
  useEffect(() => {
    fetch(`${api.BASE}/api/session`, {
      credentials: "include",
    }).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/reviews/new" element={<ReviewNew />} />
        <Route path="/properties/:id" element={<PropertyShow />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/pravila" element={<Rules />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
