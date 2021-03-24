# Discrete Cleanup Job

The purpose is to clean irrelevant data that is created off the **ingestion cycle**. There are two different scenarios:

1. If the cycle completed successfully - delete the original `.tiff` files, and mark the job as `cleaned`.
1. Upon failure - delete the original `.tiff` files, remove the created tiles, remove the discrete layer which was created in the map server using the `Map Server API` and mark as `cleaned`.

### Usage:
Just hit `npm start` to start the process. 

### Configurations:

* `LOG_LEVEL` - Could be one of the following: `error`, `warn`, `info`, `debug`.
* `DB_URL` - The URL of the discrete ingestion database.
* `MAPPROXY_API_URL` - the URL of the map server API.
* `SERVICE_PROVIDER` - The service provider in which the tiles will be created - could be one of the following: `S3`, `FS`.
* `FS_TILES_LOCATION` - Where are the tiles are located in the `FS`. Works only if `SERVER_PROVIDER` is `FS`.
* `S3_API_VERSION` - The API version of `S3`.
* `S3_ENDPOINT` - The endpoint to the `S3` server.
* `S3_ACCESS_KEY_ID` 
* `S3_SECRET_ACCESS_KEY`
* `S3_SSL_ENABLED`
* `S3_MAX_RETRIES` - The maximum number of retries to connect to the `S3` server.
* `S3_BUCKET`
* `BATCH_SIZE_DISCRETE_LAYERS` - The number of discrete layers to delete in one batch.
* `BATCH_SIZE_DIRECTORY_TIFF_DELETION` - The number of directories of tiffs to delete in one batch.
* `BATCH_SIZE_TILES_DELETION` - The number of tiles delete in one batch. 
    For `S3`: This is the number of files to delete from the `S3` server - maximum is 1000.
    For `FS`: This is the number of directories in one batch.
