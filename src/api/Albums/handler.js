const config = require("../../utils/config");

class AlbumHandler {
  constructor(albumsService, storageService, validator) {
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._validator = validator;
  }

  async postAlbumHandler({ payload }, h) {
    this._validator.validateAlbumPayload(payload);

    const albumId = await this._albumsService.addAlbum(payload);
    const response = h.response({
      status: "success",
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);

    return ({
      status: "success",
      data: {
        album,
      },
    });
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);

    const { id } = request.params;
    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: "success",
      message: "Album berhasil diperbarui",
    };
  }

  async deleteByIdHandler(request) {
    const { id } = request.params;

    await this._albumsService.deleteAlbumById(id);

    return {
      status: "success",
      message: "Album berhasil dihapus.",
    };
  }

  async postUploadAlbumCoverHandler(request, h) {
    const { cover } = request.payload;
    const { id: albumId } = request.params;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const filename = await this._storageService.writeFile(cover, cover.hapi);

    await this._albumsService.addAlbumCover(albumId, `http://${config.app.host}:${config.app.port}/album/cover/${filename}`);

    const response = h.response({
      status: "success",
      message: "Sampul berhasil diunggah",
    });
    response.code(201);
    return response;
  }

  async postLikeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this._albumsService.getAlbumById(id);
    const action = await this._albumsService.checkLikeAlbum(id, credentialId);

    const response = h.response({
      status: "success",
      message: `Berhasil ${action}`,
    });
    response.code(201);
    return response;
  }

  async getLikesCountHandler(request, h) {
    const { id } = request.params;

    const { type, data: likes } = await this._albumsService.getLikesCount(id);

    const response = h.response({
      status: "success",
      data: {
        likes,
      },
    });
    response.header("X-Data-Source", type);
    return response;
  }
}

module.exports = AlbumHandler;
