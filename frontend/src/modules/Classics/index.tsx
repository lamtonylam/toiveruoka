import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const certifiedClassics = ['Kalapuikot', 'Meksikolainen uunimakkara', 'Rapeat kalapalat']

type ClassicFoodAvailability = {
  [food: string]: {
    restaurant: string
    date: string | null
  }[]
}

type FoodItem = [string, string, string] // [date, matched_foodstring, allergens]

type FoodResponse = {
  [restaurantName: string]: Array<FoodItem>
}

function Classics() {
  const navigate = useNavigate()
  const [availability, setAvailability] = useState<ClassicFoodAvailability>({})

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  const fetchFood = async (name: string): Promise<FoodResponse | undefined> => {
    try {
      const response = await fetch(`${backendUrl}/?food=${encodeURIComponent(name)}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (err) {
      console.error('Error fetching food data:', err)
    }
  }

  useEffect(() => {
    const fetchAllFood = async () => {
      const promises = certifiedClassics.map(async (food) => {
        const data = await fetchFood(food)
        return { food, data }
      })
      const results = await Promise.all(promises)
      const newAvailability: ClassicFoodAvailability = {}
      results.forEach(({ food, data }) => {
        if (data) {
          newAvailability[food] = Object.entries(data).map(([restaurant, items]) => ({
            restaurant,
            date: items[0]?.[0] ?? null,
          }))
        }
      })
      setAvailability(newAvailability)
    }
    fetchAllFood()
  }, [])

  return (
    <>
      <header style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')}>Home</button>
        <button onClick={() => navigate('/classics')}>Classics</button>
      </header>
      <h1>Certified classics</h1>

      {certifiedClassics.map((food) => (
        <div key={food}>
          {availability[food]?.length > 0 ? <h2>{food}</h2> : null}
          {availability[food]?.length ? (
            <ul>
              {availability[food].map(({ restaurant, date }) => (
                <li key={restaurant}>
                  {restaurant}: {date}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </>
  )
}

export default Classics
