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
  
### Sheetbase

#### Sheetbase.sheet

```
Sheetbase.sheet(id)
```
- **id** 
  - `null` is default sheet with gid `0`
  - `small number` like 0-10 is for `sheet index`
  - `big number` is for `gid`
  - `string` is for `name`

```javascript
const sheet = sheetbase.sheet()
```

### Sheet

#### Sheet.find

> Find rows in the sheet

```
Sheet.find(query)
```

- **query** Mongo like query object, support
  - **extract string**: Case-sentisive. example `{field: "string"}`
  - **pattern**: Use regex to match. example `{field: /regexp/}` or `{field: "*wildcard*"}`
  - **$empty**: Check if empty cell. example `{field: {$empty: true}}`
  - **$gt**: Check cell number great than a number. `{field: {$gt: 10}}}}`
  - **$gte**: Check cell number great than or equal a number. `{field: {$gte: 10}}}}`
  - **$lt**: Check cell number less than a number. `{field: {$lt: 10}}}}`
  - **$lte**: Check cell number less than or equal a number. `{field: {$lte: 10}}`
  - **$contains**: Check cell contains a string. `{field: {$contains: "string"}}`
- **options*
  - **limit**
  - **skip**
  - **sort**: `{sort: {age: -1}}`

```javascript
// Get items that match: age great than "10", sexy is "male", have "license"
const result = await sheet.find({
  age: {$gte: 10},
  sexy: "male",
  license: {$empty: false}
})
```

### Sheet.findOne

> Find one row in the sheet

```
Sheet.findOne(query, options)
```

- **query** Mongo like query object, such like "sheet.find"
- **options**

```javascript
// Get items that match: age great than "10", sexy is "male", have "license"
const result = await sheet.find({
  age: {$gte: 10},
  sexy: "male",
  license: {$empty: false}
})
```

### Sheet.create

> Append rows into the sheet

```
Sheet.create(data)
```
- **data** Array for batch or object for one


```javascript
sheet.create({
  age: 18,
  sexy: "male",
  license: "MIT"
})
```

### Sheet.update

> Update the cells in the row

```
Sheet.create(query, update)
```
- **query** Mongodb like query, such as "find"
- **update** Mongodb like update query
  - **inc** Incre the number (string will be incresed with 0). example `{ age: {$inc: 1} }`
  - **append** Append the string to the cell
  - **prepend** Prepend the string to the cell
  - **lowercase** Lowercase the cell string
  - **uppercase** Uppercase the cell string
  - **replace** Replace the cell string. example `{ time: {$replace: {"am": "pm"}}}`


```javascript
sheet.update({
  age: 18,
  sexy: "male",
  license: "MIT"
}, {
  age: {$inc: 1},
  comment: {$append: " checked"}
})
```

### Sheet.delete

> Delete the row

```
Sheet.delete(query)
```
- **query** Mongodb like query, such as "find"


```javascript
sheet.delete({
  age: { $gt: 35 }
})
```

## License
MIT
