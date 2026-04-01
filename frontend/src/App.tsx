import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './modules/Home/index'
import Classics from './modules/Classics'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/classics" element={<Classics />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
