# Sheetbase

Use `Google sheets` such like `mongodb` to help develop website and CMS quickly.

## Example

```javascript
const sheetbase = new Sheetbase({
    credentialsFile: path.join(__dirname, 'config/credentials.json'),
    tokenFile: path.join(__dirname, 'config/token.json'),
    spreadsheetId: '1goRN3hwHgwevJzQ-xxxxx-xxxxxxxxxxx'
})

const insertedRow = await sheetbase.sheet().create({
  id: '12',
  name: 'Michael',
  sexy: 'M',
  age: '18'
})

const findRows = await sheetbase.sheet().find(
  {age: {$lte: 10}},
  {sort: {age: -1, name: 1}}
)
```

## API

- Sheetbase
  - **data** Load sheets full data
  - **sheet** Switch sheet to control base
  - **file** get spreadsheet file info in Google drive
- Sheet
  - **create**  Create row with JSON data
  - **update**  Update rows with JSON data and matched the query
  - **delete**  Delete rows that matched the query
  - **findOne** Get one row data that matched the query
  - **flush** Flush full sheet with new JSON data
- Spreadsheet
  - **load**  Load full data
  - **getSheet**  Get a sheet
  - **addSheet**  Add new sheet
  - **deleteSheet**  Delete a sheet
  - **append** Append row
  - **update** Update with rows no
  - **delete** Delete rows or columns
  - **list** List sheet data
  - **expand** Expand sheet grids

## License
MIT
