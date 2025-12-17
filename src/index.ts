import express from 'express';
import { fetchMenu } from './lib/fetchUnicafeMenu';
import { checkFoodInAllRestaurants } from './lib/unicafe';
const app = express();
app.use(express.json());

const PORT = 3000;

app.get('/', async (req, res) => {
  const food = req.query.food as string | undefined;
  if (!food) return res.status(400).send('missing ?food= query parameter');

  try {
    const data = checkFoodInAllRestaurants(food, await fetchMenu());
    return res.json(data);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch menu' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
