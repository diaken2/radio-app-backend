import express from "express";
import bcrypt from "bcrypt";
import User from "./User.js";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import RadioStreams from "./RadioStreams.js";
import MediaFile from "./MediaFile.js";
import MediaGroup from "./MediaGroup.js";
import { getMp3StreamTitle } from "./utils/getMp3StreamTitle.js";
import { fileURLToPath } from "url";
import Genre from "./GenreInform.js";
const vimeoToken = "d63914c0ff7070406b1f470b95eddc93";
const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Получаем путь к текущему файлу (аналог __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Получение всех радиостанций
// Получение всех радиостанций с поддержкой пагинации

// Удаление группы
router.delete("/media-groups/:id", async (req, res) => {
  try {
    const groupId = req.params.id;
    const group = await MediaGroup.findByIdAndDelete(groupId);

    if (!group) {
      return res.status(404).json({ error: "Группа не найдена" });
    }

    res.json({ message: "Группа удалена" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при удалении группы" });
  }
});

router.post("/media-groups", async (req, res) => {
  try {
    console.log("create media groups");
    console.log(req.body);
    const group = await MediaGroup.create(req.body);
    console.log(group);
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при создании группы" });
  }
});

router.get("/media-groups", async (req, res) => {
  try {
    console.log("get media groups");
    const groups = await MediaGroup.find();
    console.log(groups);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Ошибка получения групп" });
  }
});
// GET /api/radio/search?query=название
router.get("/search", async (req, res) => {
  const query = req.query.query;
  if (!query) return res.json([]);

  try {
    const streams = await RadioStreams.find({
      name: { $regex: query, $options: "i" }, // поиск без учёта регистра
    });

    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при поиске радио" });
  }
});

const listeners = {}; // { radioId: Set of sessionIds }

router.post("/radio/:id/enter", (req, res) => {
  console.log("/radio/:id/enter success ");
  const radioId = req.params.id;
  const sessionId = req.headers["x-session-id"];
  if (!sessionId) return res.status(400).json({ error: "No session ID" });

  if (!listeners[radioId]) {
    listeners[radioId] = new Set();
  }

  listeners[radioId].add(sessionId);
  res.json({ count: listeners[radioId].size });
});

router.post("/radio/:id/leave", (req, res) => {
  console.log("/radio/:id/leave success ");
  const radioId = req.params.id;
  const sessionId = req.headers["x-session-id"];
  if (listeners[radioId]) {
    listeners[radioId].delete(sessionId);
    if (listeners[radioId].size === 0) {
      delete listeners[radioId];
    }
  }
  res.sendStatus(200);
});

router.get("/radio/:id/listeners", (req, res) => {
  const radioId = req.params.id;
  const count = listeners[radioId]?.size || 0;
  res.json({ count });
});

router.get("/allRadios", async (req, res) => {
  try {
    const streams = await RadioStreams.find();

    res.json(streams);
  } catch (err) {
    res.status(500).json({ error: "Ошибка при поиске радио" });
  }
});

// DELETE /api/media/:id
router.delete("/media/:id", async (req, res) => {
  try {
    const deleted = await MediaFile.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Файл не найден" });
    res.json({ message: "Файл удалён" });
  } catch (err) {
    res.status(500).json({ error: "Ошибка при удалении файла" });
  }
});

router.get("/genr", async (req, res) => {
  try {
    const genres = await Genre.find();
    res.json(genres);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch genres" });
  }
});

// Добавить жанр
router.post("/genr", async (req, res) => {
  const { name } = req.body;
  try {
    const newGenre = new Genre({ name });
    await newGenre.save();
    res.status(201).json(newGenre);
  } catch (err) {
    res.status(400).json({ error: "Genre already exists or invalid" });
  }
});

router.delete("/genr/:id", async (req, res) => {
  try {
    await Genre.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Genre deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete genre" });
  }
});

router.get("/media", async (req, res) => {
  try {
    const files = await MediaFile.find().sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: "Ошибка получения медиафайлов" });
  }
});
router.get("/radios", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const radios = await RadioStreams.find().skip(skip).limit(limit);
    const total = await RadioStreams.countDocuments();
    const hasMore = skip + radios.length < total;

    res.json({ radios, hasMore });
  } catch (e) {
    res.status(500).json({ message: "Ошибка при получении радиостанций" });
  }
});

router.post("/media/image", async (req, res) => {
  try {
    const { url } = req.body;
    const type = url.includes(".gif") ? "gif" : "image";
    const media = new MediaFile({ url, type });
    await media.save();
    res.json({ message: "Изображение сохранено", media });
  } catch (err) {
    res.status(500).json({ error: "Ошибка сохранения изображения" });
  }
});
router.post("/media/video", async (req, res) => {
  try {
    const { url } = req.body;
    const media = new MediaFile({ url, type: "video" });
    await media.save();
    res.json({ message: "Видео сохранено", media });
  } catch (err) {
    res.status(500).json({ error: "Ошибка сохранения видео" });
  }
});

router.post("/upload-video", upload.single("video"), async (req, res) => {
  try {
    const filePath = path.join(__dirname, req.file.path);
    const fileSize = fs.statSync(filePath).size;

    // Шаг 1. Создаём видео на Vimeo, указываем способ загрузки — TUS
    const createRes = await axios.post(
      "https://api.vimeo.com/me/videos",
      {
        upload: {
          approach: "tus",
          size: fileSize,
        },
        name: req.file.originalname,
      },
      {
        headers: {
          Authorization: `Bearer ${vimeoToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const uploadLink = createRes.data.upload.upload_link;
    const videoUri = createRes.data.uri; // например, "/videos/123456789"

    // Шаг 2. Загружаем сам файл через TUS
    const videoBuffer = fs.readFileSync(filePath);
    await axios.patch(uploadLink, videoBuffer, {
      headers: {
        "Tus-Resumable": "1.0.0",
        "Upload-Offset": "0",
        "Content-Type": "application/offset+octet-stream",
        "Content-Length": videoBuffer.length,
      },
    });

    // Удаляем временный файл
    fs.unlinkSync(filePath);

    // Шаг 3. Проверяем статус загрузки видео (сделаем ожидание до завершения)
    const videoId = videoUri.split("/").pop();
    await waitForVideoToBeAvailable(videoId); // Ждем, пока видео будет доступно

    // Возвращаем ссылку на встраиваемый плеер
    const embedUrl = await getVideoEmbedUrl(videoId);
    console.log(embedUrl);

    res.json({ embed_url: embedUrl });
  } catch (err) {
    console.error(
      "Ошибка при загрузке видео:",
      err?.response?.data || err.message
    );
    res.status(500).json({ error: "Ошибка при загрузке видео" });
  }
});

async function waitForVideoToBeAvailable(videoId) {
  let isAvailable = false;

  while (!isAvailable) {
    try {
      const response = await axios.get(
        `https://api.vimeo.com/videos/${videoId}`,
        {
          headers: {
            Authorization: `Bearer ${vimeoToken}`,
          },
        }
      );

      if (response.data.status === "available") {
        isAvailable = true;
        console.log("Видео успешно загружено и доступно для встраивания");
      } else {
        console.log("Видео еще не готово, повторная проверка...");
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Повторяем проверку через 5 секунд
      }
    } catch (error) {
      console.error("Ошибка при проверке статуса видео:", error);
      break; // Если произошла ошибка, выходим из цикла
    }
  }
}

// Получаем ссылку для iframe
async function getVideoEmbedUrl(videoId) {
  try {
    const response = await axios.get(
      `https://api.vimeo.com/videos/${videoId}`,
      {
        headers: {
          Authorization: `Bearer ${vimeoToken}`,
        },
      }
    );

    // Получаем ссылку для встраивания с хэшем
    const embedLink = modifyIframeSrc(response.data.embed.html);
    return embedLink; // Возвращаем ссылку на плеер
  } catch (error) {
    console.error("Error fetching video data:", error);
  }
}

// Функция для модификации src ссылки в iframe
function modifyIframeSrc(iframeText) {
  const regex = /src="([^"]+)"/;
  const match = iframeText.match(regex);

  if (match) {
    let src = match[1]; // Извлекаем ссылку из src

    // Проверяем, есть ли уже параметры в ссылке
    const hasParams = src.includes("?");

    // Добавляем параметры autoplay, loop, muted
    if (hasParams) {
      src += "&autoplay=1&loop=1&muted=1";
    } else {
      src += "?autoplay=1&loop=1&muted=1";
    }

    return src; // Возвращаем измененную ссылку
  }
  return null; // Если не удалось найти src
}

// Создание новой радиостанции
router.post("/radios", async (req, res) => {
  console.log("/radios path");
  const { name, url, descript, genre, logo } = req.body;

  if (!name || !url || !descript || !genre || !logo) {
    return res.status(400).json({ message: "Все поля обязательны" });
  }

  try {
    await RadioStreams.create({ name, url, descript, genre, logo });
    const radios = await RadioStreams.find(); // вернем обновлённый список
    res.status(201).json(radios);
  } catch (e) {
    res.status(500).json({
      message: "Ошибка при добавлении радиостанции",
      error: e.message,
    });
  }
});

router.post("/register", async (req, res) => {
  console.log("register");
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(existingUser);
    console.log("user exist");
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ email, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ email: newUser.email });
});

// Вход пользователя
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ email: user.email });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Удаление радиостанции
router.delete("/radios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRadio = await RadioStreams.findByIdAndDelete(id);
    if (!deletedRadio) {
      return res.status(404).json({ message: "Радиостанция не найдена" });
    }

    const radios = await RadioStreams.find(); // вернем обновлённый список
    res.json(radios);
  } catch (e) {
    res.status(500).json({
      message: "Ошибка при удалении радиостанции",
      error: e.message,
    });
  }
});

router.get("/:id/current-song", async (req, res) => {
  console.log("req.params.id");
  const radio = await RadioStreams.findById(req.params.id);
  if (!radio) return res.status(404).json({ message: "Radio not found" });
  console.log(radio.url);
  const title = await getMp3StreamTitle(radio.url);
  console.log(title);
  res.json({ currentSong: title });
});

router.get("/genre/:genre", async (req, res) => {
  const genre = req.params.genre;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  try {
    const radios = await RadioStreams.find({ genre }).skip(skip).limit(limit);
    const total = await RadioStreams.countDocuments({ genre });
    const hasMore = skip + radios.length < total;

    res.status(200).json({ radios, hasMore });
  } catch (error) {
    res.status(500).json({ message: "Ошибка при получении жанра" });
  }
});

// В файле роутов
router.get("/radios/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const radio = await RadioStreams.findById(id);
    if (!radio) {
      return res.status(404).json({ message: "Радиостанция не найдена" });
    }
    res.json(radio);
  } catch (e) {
    res
      .status(500)
      .json({ message: "Ошибка при получении радио", error: e.message });
  }
});

export default router;
