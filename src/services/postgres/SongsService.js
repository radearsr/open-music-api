const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");
const { mapDBToModel } = require("../../utils");

class SongsService {
  constructor() {
    this._pool = new Pool;
  }

  async addSong(
    title,
    year,
    genre,
    performer,
    duration,
    albumId,
  ) {
    const id = `song-${nanoid(16)}`;

    const query = {
      text: "INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      values: [id, title, year, genre, performer, duration, albumId],
    };

    const result = await this._pool.query(query);

    const [resultRow] = result.rows;

    if (!resultRow.id) {
      throw new InvariantError("Gagal menambahkan musik");
    }

    return resultRow.id;
  }

  async getSongs(title, performer) {
    let query = "SELECT id, title, performer FROM songs";

    if ((title !== undefined && title !== "") && (performer !== undefined && performer !== "")) {
      query = `SELECT id, title, performer FROM songs
      WHERE LOWER(title) LIKE '%${title}%'
      AND LOWER(performer) LIKE '%${performer}%'`;
    } else if ((title !== undefined && title !== "") || (performer !== undefined && performer !== "")) {
      query = `SELECT id, title, performer FROM songs
      WHERE LOWER(title) LIKE '%${title}%'
      OR LOWER(performer) LIKE '%${performer}%'`;
    }
    const { rows } = await this._pool.query(query);
    return rows;
  }

  async getSongById(id) {
    const query = {
      text: "SELECT * FROM songs WHERE id = $1",
      values: [id],
    };

    const result = await this._pool.query(query);

    const [resultRow] = result.rows.map(mapDBToModel);

    if (!result.rowCount) {
      throw new NotFoundError("Musik tidak ditemukan");
    }
    return resultRow;
  }

  async editSongById(id, {
    title,
    year,
    performer,
    genre,
    duration,
    albumId,
  }) {
    const query = {
      text: "UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, album_id = $6 WHERE id = $7 RETURNING id",
      values: [title, year, performer, genre, duration, albumId, id],
    };

    const result = await this._pool.query(query);

    const [resultRow] = result.rows;

    if (!result.rowCount) {
      throw new NotFoundError("Gagal memperbarui musik. Id tidak ditemukan");
    }

    return resultRow.id;
  }

  async deleteSongById(id) {
    const query = {
      text: "DELETE FROM songs WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Gagal menghapus musik. Id tidak ditemukan");
    }
  }
}

module.exports = SongsService;
