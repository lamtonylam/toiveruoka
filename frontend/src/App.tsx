import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [foodName, setFoodName] = useState('')
  const [responseData, setResponseData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  const fetchFood = async (name: string) => {
    if (name.length === 0) {
      setResponseData(null)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    setResponseData(null)

    try {
      const response = await fetch(`${backendUrl}/?food=${encodeURIComponent(name)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setResponseData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFood(foodName)
    }, 400)

    return () => clearTimeout(timer)
  }, [foodName])

  return (
    <>
      <h1>Unicafe foodfinder</h1>
      <div className="input-container">
        <input
          type="text"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="Enter food name"
        />
      </div>

      {loading && <div style={{ marginTop: '20px' }}>Loading...</div>}

      {error && <div style={{ color: 'red', marginTop: '20px' }}>Error: {error}</div>}

      {responseData && (
        <div>
          <h2>Results:</h2>
          <div>
            {Object.entries(responseData).length === 0 && <p>No results found</p>}
            {Object.entries(responseData).map(([restaurant, items]: [string, any]) => (
              <div key={restaurant}>
                <h3>{restaurant}</h3>
                <div>
                  {items.map((item: any[], index: number) => (
                    <div key={index}>
                      <div>- {item[0]}</div>
                      <div>- {item[1]}</div>
                      {item[2] && <>- Allergeenit: {item[2]}</>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default App
