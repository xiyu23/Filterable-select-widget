//2017/10/18 [bug1018]option cannot be selected after mouse clicked in the input
//           [Fix]:   remove 'focusout' event of 'input,arrowSpan,divMatched'. Only input of these 3 html can get focused, focus will transfer from 'input' to 'BODY' when user is about 
//                    to click one option('li') because 'li' cannot receive focus. As you can see, BODY is returned while the event handler which *HIDE THE divMatched* is called.
//2017/09/14 [bug0914]options with same text cannot be selected
//           [Fix]:   add option's corresponding value to 'li'
//filterable select (xiyu915@home.bk, 2017/07/25)
//功能：使得下拉框可即时过滤
//将要构造的html tree结构：
//         divContainer
//         /     |     \
//      span    span  divMatched
//     /    \             |
//  input  select    ulMatchedList
//                                        
//描述：
//    该方法会创建上述html结构；对于样式，该方法会根据select的样式调整input、divMatched的css。因此调用者只需关注自己的select样式即可。
//    input覆盖到select之上，divMatched用来显示匹配的选项。
//调用方法：
//（若用户有自定义的select onchange代码要执行，则需作为参数传入）
//e.g.1
//  var myOnChangeHandler = function (selectElement){
//      //Code goes here...
//  };
//  $("#mySelect").MakeSelectFilterable(myOnChangeHandler);
//
//e.g.2
//  $("#mySelect1,#mySelect2").MakeSelectFilterable();
//
//Attention:
//  1.
//    在input中输入进行匹配后， * 必须 * 从给定的匹配选项中选择一个。
//    即，纯手工录入或CTRL+V产生的完全匹配选项是会被认为无效的。
//  2.
//    在过滤后，ul中的选项可能出现"相同text"的情况，单击li时，处理逻辑如下：
//    a. 不同text - 根据text筛选
//    b. 相同text - 不同value，根据value筛选
//                - 相同value，选择index最小的选项
//
//Bugs:
//  1. 才发现，调用该方法时若select的index恰好为-1，在构造html对select wrap后，index被置为0了。。。
//  应对方法：暂时要求调用时，select index不能为-1！
(function ($) {
    //enables the select filterable, custom 'select onchange' event handler could be given as well if you like
    $.fn.MakeSelectFilterable = function (UserDefinedOnChangeEventHandler) {
        /*
        var DEBUG = false;
        var log = function (message) {
            var text = $("#logArea").val();
            text += message + "\n";
            $("#logArea").val(text);
        };
        */
        //determine IE version
        //支持IE8、IE9、IE11
        //IE8, onpropertychange triggers also by set .val()，赋值时需要防止event handler执行
        //IE9, oninput无法响应backspace，使用onselectionchange来实现监听
        var dummyDiv = document.createElement("div");

        dummyDiv.innerHTML = "<!--[if IE 8]><i></i><![endif]-->";
        var isIE8 = (dummyDiv.getElementsByTagName("i").length == 1);

        dummyDiv.innerHTML = "<!--[if IE 9]><i></i><![endif]-->";
        var isIE9 = (dummyDiv.getElementsByTagName("i").length == 1);

        if (isIE8) {

        }
        else if (isIE9) {//VERY BIG BUG
            //Fix IE9 bug: cannot respond to backspace/CTRL+X/DELETE
            //Only bind one listener to monitor all our 'input' controls inside filterable select widgets.
            $(document).off("selectionchange.ListenToFilterableInput").on("selectionchange.ListenToFilterableInput", function (e) {
                var actEl = document.activeElement;
                if (actEl.tagName === 'INPUT' && actEl.type === 'text') {
                    //determine whether it is our filterble input
                    var $container = $(actEl).closest('div.FilterableSelectContainer');
                    if ($container.length != 1) {//event.target is not our input
                        return;
                    }
                    var previousText = $(actEl).attr('previous_text');
                    var currentText = $(actEl).val();
                    if (currentText != previousText) {
                        $(actEl).attr('previous_text', currentText);
                        $(actEl).trigger('input');
                    }
                }
            });
        }
        else {//!IE9 && !IE8
            dummyDiv.innerHTML = "<!--[if lt IE 8]><i></i><![endif]-->";
            var isLessThanIE8 = (dummyDiv.getElementsByTagName("i").length == 1);
            if (isLessThanIE8) {// < IE8, filterable select may be broken.");
                var prompt = "您的浏览器版本低于IE8，可能造成即时下拉框筛选功能异常！请使用IE8+。";//"WE DON'T LIKE YOUR BROWSER";
                alert(prompt);
            }
            else {
                dummyDiv.innerHTML = "<!--[if !IE]><i></i><![endif]-->";
                var isNotIE = (dummyDiv.getElementsByTagName("i").length == 1);
                if (!isNotIE) {
                    //IE10+
                }
                else {
                    //Other browsers
                }
            }
        }

        //Deal with cases: once user click outside our filterable widgets, the 'divMatched'(displayed for matched options) would be hidden.
        $(document).off("click.ListenToClickOutside").on("click.ListenToClickOutside", function (e) {
            //determine whether the click event occurs 'inside', which refers to:
            //1. the descendant of 'divMatched', including itself, OR
            //2. the input control, OR
            //3. the down arrow span.
            var clickedElement = e.target;
            var $divContainers = $('div.FilterableSelectContainer');
            var isInsideClick = false;

            $divContainers.each(function (i, divContainer) {
                var $input = $(divContainer).children().first().children().first();
                var $arrowSpan = $(divContainer).children().first().next();
                var $divMatched = $(divContainer).children('div');

                if ($(clickedElement).closest($divMatched).length == 1) {
                    isInsideClick = true;
                }
                else if ($(clickedElement).is($input)) {
                    isInsideClick = true;
                }
                else if ($(clickedElement).is($arrowSpan)) {
                    isInsideClick = true;
                }
                if (isInsideClick) {
                    return false;
                }
            });
            if (!isInsideClick) {//hide all
                $divContainers.children('div').hide();
            }
        });

        return this.each(function (i, select) {
            //build html structure
            $(select).wrap('<span>');//using only the structure, not itself! see jQuery API
            var input = $('<input type="text" autocomplete="off" previous_text="" />').get(0);
            $(input).insertBefore(select);
            var currentOptionText = $(select).children('option:selected').text();
            if (currentOptionText) {
                $(input).attr("previous_text", currentOptionText);
                $(input).val(currentOptionText);
            }

            var firstSpan = $(select).parent().get(0);
            $(firstSpan).wrap('<div class="FilterableSelectContainer"></div>');
            var $divContainer = $(firstSpan).parent();
            $divContainer.append('<span></span>').append('<div><ul></ul></div>');//ps. append('<span>') won't work for IE8, now it works.
            var arrowSpan = $(firstSpan).next().get(0);
            var divMatched = $(arrowSpan).next().get(0);
            var ulMatchedList = $(divMatched).children().get(0);

            //auxiliary variables
            var needSkipOnPropertyChange = false;//IE8在通过.val()为input赋值时会触发onpropertychange

            //选中一个，更新text
            $(select).on("change", function () {
                var optionText = $(select).children("option:selected").text();
                $(input).attr('previous_text', optionText);
                needSkipOnPropertyChange = true;
                $(input).val(optionText);
                needSkipOnPropertyChange = false;
                if ($(divMatched).is(":visible")) {
                    $(divMatched).hide().css("zIndex", "auto");
                }
                if (UserDefinedOnChangeEventHandler)
                    UserDefinedOnChangeEventHandler(this);
            });
            function HTMLEscape(str) {
                return str.replace(/&/g, "&amp;")//html特殊字符转义
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
            }
            function REGEXPEscape(str) {
                return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");//正则特殊字符转义
            }
            //过滤
            $(input).on("input propertychange", function (e, param1) {
                //true: focused/arrow clicked事件，显示全部选项，对匹配的选项加上高亮;
                //false: input/propertychange事件，仅高亮显示匹配的选项
                var displayAll = (param1 == null || !param1.hasOwnProperty("displayAll")) ? false : true;
                if (isIE8 && needSkipOnPropertyChange) {
                    return false;
                }
                var valueChanged = false;
                if (e.type == 'propertychange') {
                    valueChanged = e.originalEvent.propertyName == 'value';
                } else {
                    valueChanged = true;
                }
                if (!valueChanged) {
                    return false;
                }
                var currentText = $(this).val();
                if (isIE9) {
                    $(input).attr('previous_text', currentText);
                }

                //clear
                $(ulMatchedList).empty();

                //and init all
                $(select).children().each(function (i, elem) {
                    if (!$(elem).is('option')) {
                        return;
                    }
                    var li = document.createElement("li");
                    var optionText = $(elem).text(),
                        optionValue = $(elem).val();
                    if (!optionValue) {
                        optionValue = "";
                    }
                    $(li).text(optionText).attr('value', optionValue);
                    $(ulMatchedList).append(li);
                });

                //filter
                var searchStr = $(this).val().replace(/^\s*/, "").replace(/\s*$/, "");
                if (searchStr != "") {
                    $(ulMatchedList).children().each(function (i, elem) {
                        var text = $(elem).text();
                        if (text.indexOf(searchStr) < 0)//doesn't match
                        {
                            if (!displayAll) {
                                $(elem).remove();
                            }
                        }
                        else //match, 为每个匹配的子串套上高亮显示
                        {
                            //设置html前需转义可能包含的html关键字符
                            searchStr = HTMLEscape(searchStr);
                            text = HTMLEscape(text);
                            var reg = new RegExp('(' + REGEXPEscape(searchStr) + ')+', 'g');//相当于 /(searchStr)+/g
                            var newHTML = text.replace(reg, '<span class="highlight">$&</span>');
                            $(elem).empty().html(newHTML);//http://api.jquery.com/html/ Note
                        }
                    });
                }

                //show
                if ($(divMatched).is(":hidden") && 0 < $(ulMatchedList).children().length) {
                    $(divMatched).show().css("zIndex", 869);
                }
                else if ($(divMatched).is(":visible") && $(ulMatchedList).children().length < 1) {
                    $(divMatched).hide().css("zIndex", "auto");
                }
                if (!displayAll && $(select).prop("selectedIndex") != -1) {//input变化时，select始终处于待选择状态，必须通过下方匹配的选择一项方可生效。
                    $(select).prop("selectedIndex", -1);
                }

                //just show list, not necessary to bubble
                if (displayAll) {
                    return false;
                }
            });

            //过滤并显示  focus: focus; click: focus->click
            $(input).on("focus", function () {
                //hide others
                $('div.FilterableSelectContainer div').not(divMatched).hide();
                $(input).trigger("input", { displayAll: true });
            });

            //单击箭头，toggle匹配列表的显示与隐藏
            $(arrowSpan).on("click", function () {
                //hide others
                $('div.FilterableSelectContainer div').not(divMatched).hide();
                var hasShown = !$(divMatched).is(":hidden");
                if (hasShown) {
                    $(divMatched).hide().css("zIndex", "auto");
                }
                else {
                    $(input).trigger("input", { displayAll: true });
                }
                return false;
            });

            //click li, 在select选中
            $(divMatched).on("click", "li", function () {
                var selectedText = $(this).text();
                var optionsWithSameText = [];
                $(select).children('option').each(function (i, elem) {
                    if ($(elem).text() == selectedText) {//got one, there's more, probably(same Text but different Value). So let's iterate to the end
                        optionsWithSameText.push({ option: elem, index: i });
                    }
                });

                var length = optionsWithSameText.length;
                var matchedOptionIndex = -1;
                if (length == 1) {//we'v caught that option just by Text
                    matchedOptionIndex = optionsWithSameText[0].index;
                }
                else if (1 < length) {//there's more than 1 options that have same Text but differs on Value(maybe, their Values are same again!)
                    var selectedValue = $(this).attr('value');
                    //Warning: 'value's are NOT strictly supposed to be different against every two-option pair.(Because there're still many mad guys in the world!)
                    //If that happens, how to make a choice? Just select the one which comes first.
                    var optionsWithSameValue = [];
                    for (var i = 0; i < length; i++) {
                        var optionObj = optionsWithSameText[i];
                        if ($(optionObj.option).val() == selectedValue) {
                            optionsWithSameValue.push({ option: optionObj.option, index: optionObj.index });
                        }
                    }
                    var vLen = optionsWithSameValue.length;
                    if (!(vLen < 1)) {//same text, but we can distinguish them by value
                        if (1 < vLen) {
                            //same text, same value, we're f*cked, so we'll select the first one for you
                        }

                        matchedOptionIndex = optionsWithSameValue[0].index;
                    }
                    else {//vLen < 1, unexpected situation
                        alert('[unexpected situation] no \'value\' matched.');
                    }
                }
                else {//length < 1, unexpected situation
                    alert('[unexpected situation] no \'text\' matched.');
                }

                if (-1 < matchedOptionIndex) {
                    $(select).prop("selectedIndex", matchedOptionIndex).change();
                }
                return false;
            });

            //设置css，使得text参考select的样式，覆盖其上
            /*if (DEBUG) {
                //output styles of select
                var selOuterWidth = $(select).outerWidth(),
                    selOuterHeight = $(select).outerHeight(),
                    selTop = $(select).position().top,
                    selLeft = $(select).position().left,
                    arrowSpanOuterWidth = $(arrowSpan).outerWidth(),
                    arrowSpanOuterHeight = $(arrowSpan).outerHeight();
                log("Before setting styles:");
                log("selOuterWidth: " + selOuterWidth);
                log("selOuterHeight: " + selOuterHeight);
                log("selTop: " + selTop);
                log("selLeft: " + selLeft);
                log("arrowSpanOuterWidth: " + arrowSpanOuterWidth);
                log("arrowSpanOuterHeight: " + arrowSpanOuterHeight);
            }*/

            var outerWidth = $(select).outerWidth() - $(arrowSpan).outerWidth();//outerWidth yields number: 792.23 
            var outerHeight = $(select).outerHeight();
            var top = $(select).position().top,//relative to its parent's 'padding box'
                left = $(select).position().left;//number: 20

            //set input, 7 property changes will trigger 'propertychange' event of the input control under IE8.
            $(input).outerWidth(outerWidth).outerHeight(outerHeight);
            $(input).css("top", top + "px").css("left", left + "px");
            $(input).css("font-size", $(select).css("font-size")).css("color", $(select).css("color")).css("font-family", $(select).css("font-family"));//font, color and so on
            $(input).css({
                'outline': 'none'
            });

            //set select
            $(select).attr('tabIndex', -1);//As select beneath our filterable input control, so there's no need to stop at it through TAB key.
            $(select).outerWidth(outerWidth);

            //set second span
            $(arrowSpan).outerHeight($(firstSpan).outerHeight());

            //set divMatched
            $(divMatched).css("top", $(firstSpan).outerHeight() + "px").outerWidth($(firstSpan).outerWidth() + $(arrowSpan).outerWidth());
            $(divMatched).css("font-size", $(select).css("font-size")).css("color", $(select).css("color")).css("line-height", 1.5).css("font-family", $(select).css("font-family"));
        });
    }
})(jQuery);