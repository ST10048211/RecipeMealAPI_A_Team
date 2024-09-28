// app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./firebase');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Endpoint to add a recipe
app.post('/addRecipe', async (req, res) => {
  const { name, totalCalories, ingredients } = req.body;

  try {
    const recipeRef = await db.collection('recipes').add({
      name,
      totalCalories,
      ingredients
    });
    res.status(200).send({ success: true, id: recipeRef.id });
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Endpoint to get all recipes
app.get('/getRecipes', async (req, res) => {
  try {
    const snapshot = await db.collection('recipes').get();
    const recipes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.status(200).send(recipes);
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Endpoint to add or update a meal
app.post('/addMeal', async (req, res) => {
  const { email, date, mealCategory, mealItems } = req.body;

  try {
    // Check if an entry with the same email, date, and mealCategory exists
    const mealQuery = await db.collection('meals')
      .where('email', '==', email)
      .where('date', '==', date)
      .where('mealCategory', '==', mealCategory)
      .get();

    if (!mealQuery.empty) {
      // Entry exists, update the meal items
      const mealDoc = mealQuery.docs[0]; // Get the first matching document
      const existingMealItems = mealDoc.data().mealItems || [];

      // Merge new meal items with existing ones (without duplicates)
      const updatedMealItems = [
        ...existingMealItems,
        ...mealItems.filter(item => !existingMealItems.some(existingItem => existingItem.name === item.name))
      ];

      // Update the document with the new meal items
      await db.collection('meals').doc(mealDoc.id).update({ mealItems: updatedMealItems });
      res.status(200).send({ success: true, message: 'Meal updated successfully', id: mealDoc.id });
    } else {
      // Entry doesn't exist, add a new one
      const mealRef = await db.collection('meals').add({
        email,
        date,
        mealCategory,
        mealItems
      });
      res.status(200).send({ success: true, message: 'Meal added successfully', id: mealRef.id });
    }
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});

// Endpoint to get all meals
app.get('/getMeals', async (req, res) => {
  try {
    const mealQuerySnapshot = await db.collection('meals').get();

    if (mealQuerySnapshot.empty) {
      return res.status(404).send({ success: false, message: 'No meals found' });
    }

    const meals = mealQuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).send(meals);
  } catch (error) {
    res.status(500).send({ success: false, error: error.message });
  }
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
