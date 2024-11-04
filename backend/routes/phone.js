import express from "express";

import auth from "../middleware/auth.js";

import User from "../models/User.js";

const router = express.Router();

const RENTAL_PRICE = 9.99;

// Generate virtual number

router.post("/generate", auth, async (req, res) => {
  try {
    const { country } = req.body;

    if (!country) {
      return res.status(400).json({ message: "Country is required" });
    }

    const countryCode = getCountryCode(country);

    const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000;

    const virtualNumber = `+${countryCode}${randomNumber}`;

    // Check if number already exists

    const numberExists = await User.findOne({
      "virtualNumbers.number": virtualNumber,
    });

    if (numberExists) {
      return res
        .status(400)
        .json({ message: "Number already exists. Please try again." });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Make the number active and rented by default

    user.virtualNumbers.push({
      number: virtualNumber,

      country,

      active: true, // Set active to true by default

      rented: true, // Set rented to true by default

      price: RENTAL_PRICE,

      rentedAt: new Date(),

      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await user.save();

    res.json(user.virtualNumbers);
  } catch (err) {
    console.error("Generate number error:", err);

    res.status(500).json({ message: "Server error while generating number" });
  }
});

// Get user by virtual number

router.get("/user/:number", auth, async (req, res) => {
  try {
    const { number } = req.params;

    console.log("Looking up user for number:", number);

    if (!number) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findOne({
      "virtualNumbers.number": number,

      "virtualNumbers.rented": true,

      "virtualNumbers.active": true,
    });

    console.log("Found user:", user ? user._id : "No user found");

    if (!user) {
      return res
        .status(404)
        .json({ message: "No active user found with this number" });
    }

    res.json({
      userId: user._id,

      phoneNumber: number,
    });
  } catch (err) {
    console.error("Get user by number error:", err);

    res.status(500).json({ message: "Server error while fetching user" });
  }
});

// Rent virtual number

router.post("/rent/:numberId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const numberIndex = user.virtualNumbers.findIndex(
      (num) => num._id.toString() === req.params.numberId
    );

    if (numberIndex === -1) {
      return res.status(404).json({ message: "Number not found" });
    }

    if (user.virtualNumbers[numberIndex].rented) {
      return res.status(400).json({ message: "Number is already rented" });
    }

    user.virtualNumbers[numberIndex].rented = true;

    user.virtualNumbers[numberIndex].rentedAt = new Date();

    user.virtualNumbers[numberIndex].expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );

    await user.save();

    res.json(user.virtualNumbers);
  } catch (err) {
    console.error("Rent number error:", err);

    res.status(500).json({ message: "Server error while renting number" });
  }
});

// Update virtual number status

router.patch("/status/:numberId", auth, async (req, res) => {
  try {
    const { active } = req.body;

    if (typeof active !== "boolean") {
      return res
        .status(400)
        .json({ message: "Active status must be a boolean" });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const numberIndex = user.virtualNumbers.findIndex(
      (num) => num._id.toString() === req.params.numberId
    );

    if (numberIndex === -1) {
      return res.status(404).json({ message: "Number not found" });
    }

    user.virtualNumbers[numberIndex].active = active;

    await user.save();

    res.json(user.virtualNumbers);
  } catch (err) {
    console.error("Update status error:", err);

    res.status(500).json({ message: "Server error while updating status" });
  }
});

function getCountryCode(country) {
  const codes = {
    USA: "1",

    UK: "44",

    Japan: "81",

    Australia: "61",

    Singapore: "65",
  };

  return codes[country] || "1";
}

export default router;
