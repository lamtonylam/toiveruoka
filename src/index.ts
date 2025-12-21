import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { fetchMenu } from './lib/fetchUnicafeMenu';
import { checkFoodInAllRestaurants } from './lib/unicafe';
import { swaggerSpec } from './swagger';

const app = express();
app.use(express.json());

const PORT = 3000;

// Swagger UI
// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /:
 *   get:
 *     summary: Find food in all Unicafe restaurants
 *     description: Search for a specific food item across all Unicafe restaurants and get information about where and when it's available.
 *     parameters:
 *       - in: query
 *         name: food
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the food item to search for
 *         example: pizza
 *     responses:
 *       200:
 *         description: Successfully found food items across restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 restaurants:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Missing food query parameter
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       500:
 *         description: Failed to fetch menu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});
