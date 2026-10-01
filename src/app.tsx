import { Route, Routes } from 'react-router'

function Home() {
  return <h1 className="p-4 text-2xl font-bold">Tónus</h1>
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
