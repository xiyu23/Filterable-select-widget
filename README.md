# Filterable-select-widget
An easy select plugin for filterable select

## Usage
1. Add necessary .js and .css to your page (jQuery `1.7+` required)
```html
<script src="FilterableSelect/filterableSelect.js"></script>
<link rel="stylesheet" href="FilterableSelect/css.css">
```
2. Let's say you have a `<select>` that needs to be filterable
```html
<select id="my-select"></select>
```

3. Just call `MakeSelectFilterable` function on your jQuery object `$my-select`
```javascript
<script type="text/javascript">
    $('#my-select').MakeSelectFilterable(OnSelectChange);

    //Optional callback
    function OnSelectChange(selectElem) {
        var option = $(selectElem).children('option:selected').text();
        console.log('You have choosen an option: ' + option);
    }
</script>
```
