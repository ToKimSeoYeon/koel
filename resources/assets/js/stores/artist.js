import Vue from 'vue';
import {
    reduce,
    each,
    find,
    union,
    difference,
    take,
    filter,
    orderBy
} from 'lodash';

import config from '../config';
import stub from '../stubs/artist';
import albumStore from './album';

export default {
    stub,

    state: {
        artists: [],
    },

    /**
     * Init the store.
     *
     * @param  {Array.<Object>} artists The array of artists we got from the server.
     */
    init(artists) {
        this.all = artists;

        // Traverse through artists array to get the cover and number of songs for each.
        each(this.all, artist => {
            this.setupArtist(artist);
        });

        albumStore.init(this.all);
    },

    setupArtist(artist) {
        this.getImage(artist);
        Vue.set(artist, 'playCount', 0);
        Vue.set(artist, 'songCount', reduce(artist.albums, (count, album) => count + album.songs.length, 0));
        Vue.set(artist, 'info', null);

        return artist;
    },

    /**
     * Get all artists.
     *
     * @return {Array.<Object>}
     */
    get all() {
        return this.state.artists;
    },

    /**
     * Set all artists.
     *
     * @param  {Array.<Object>} value
     */
    set all(value) {
        this.state.artists = value;
    },

    /**
     * Get an artist object by its ID.
     *
     * @param  {Number} id
     */
    byId(id) {
        return find(this.all, { id });
    },

    /**
     * Adds an artist/artists into the current collection.
     *
     * @param  {Array.<Object>|Object} artists
     */
    add(artists) {
        artists = [].concat(artists);
        each(artists, a => this.setupArtist(a));

        this.all = union(this.all, artists);
    },

    /**
     * Remove artist(s) from the store.
     *
     * @param  {Array.<Object>|Object} artists
     */
    remove(artists) {
        this.all = difference(this.all, [].concat(artists));
    },

    /**
     * Add album(s) into an artist.
     *
     * @param {Object} artist
     * @param {Array.<Object>|Object} albums
     *
     */
    addAlbumsIntoArtist(artist, albums) {
        albums = [].concat(albums);

        artist.albums = union(artist.albums ? artist.albums : [], albums);

        each(albums, album => {
            album.artist_id = artist.id;
            album.artist = artist;
        });

        artist.playCount = reduce(artist.albums, (count, album) => count + album.playCount, 0);
    },

    /**
     * Remove album(s) from an artist.
     *
     * @param  {Object} artist
     * @param  {Array.<Object>|Object} albums
     */
    removeAlbumsFromArtist(artist, albums) {
        artist.albums = difference(artist.albums, [].concat(albums));
        artist.playCount = reduce(artist.albums, (count, album) => count + album.playCount, 0);
    },

    /**
     * Checks if an artist is empty.
     *
     * @param  {Object}  artist
     *
     * @return {boolean}
     */
    isArtistEmpty(artist) {
        return !artist.albums.length;
    },

    /**
     * Get all songs performed by an artist.
     *
     * @param {Object} artist
     *
     * @return {Array.<Object>}
     */
    getSongsByArtist(artist) {
        if (!artist.songs) {
            artist.songs = reduce(artist.albums, (songs, album) => songs.concat(album.songs), []);
        }

        return artist.songs;
    },

    /**
     * Get the artist's image.
     *
     * @param {Object} artist
     *
     * @return {String}
     */
    getImage(artist) {
        if (!artist.image) {
            // Try to get an image from one of the albums.
            artist.image = config.unknownCover;

            artist.albums.every(album => {
                // If there's a "real" cover, use it.
                if (album.image !== config.unknownCover) {
                    artist.image = album.cover;

                    // I want to break free.
                    return false;
                }
            });
        }

        return artist.image;
    },

    /**
     * Get top n most-played artists.
     *
     * @param  {Number} n
     *
     * @return {Array.<Object>}
     */
    getMostPlayed(n = 6) {
        // Only non-unknown artists with actually play count are applicable.
        const applicable = filter(this.all, artist => {
            return artist.playCount && artist.id !== 1;
        });

        return take(orderBy(applicable, 'playCount', 'desc'), n);
    },
};
