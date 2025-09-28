const express = require("express");
const Note = require("../models/Note");
const jwt = require("jsonwebtoken");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const fetchUser = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return res.status(401).json({ error: "Access denied" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// GET notes
router.get("/", fetchUser, async (req, res) => {
  const notes = await Note.find({ userId: req.user });
  res.json(notes);
});

// POST note
router.post("/", fetchUser, async (req, res) => {
  const { title, description, tag } = req.body;
  const note = new Note({ userId: req.user, title, description, tag });
  await note.save();
  res.json(note);
});

// PUT note
router.put("/:id", fetchUser, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ error: "Note not found" });
  if (note.userId.toString() !== req.user) return res.status(401).json({ error: "Not authorized" });

  note.title = req.body.title || note.title;
  note.description = req.body.description || note.description;
  note.tag = req.body.tag || note.tag;
  await note.save();
  res.json(note);
});

// DELETE note
router.delete("/:id", fetchUser, async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) return res.status(404).json({ error: "Note not found" });
  if (note.userId.toString() !== req.user) return res.status(401).json({ error: "Not authorized" });

  await note.deleteOne();
  res.json({ message: "Note deleted" });
});

module.exports = router;
