
/**
 * Загрузчик скриптов и стилей
 * ---------------------------------------------------------------------------------
 **/
(function (root) {

    var src;
    var script;
    var pendingScripts = [];
    var firstScript = document.scripts[0];


    /**
     * Массив для  перечисления загружаемых скриптов
     **/
    var scripts = [];

    /**
     * Массив для  перечисления загружаемых скриптов
     **/
    var styles = [];

    /**
     * Счетчик загруженных скриптов.
     * При подключении скриптов на страницу инкрементируется.
     * При отработке onload-обработчика декрементируется
     **/
    var countOfLoad = 0;

    /**
     * Счетчик загруженных стилей.
     * При подключении стилей на страницу инкрементируется.
     * При отработке onload-обработчика декрементируется
     **/
    //var countOfLoadStyle = 0;

    /**
     * Состояние загрузки скриптов.
     * false - не загружены или еще небыли предоставлены для загрузки
     * true - скрипты загружены
     **/
    var loadState = false;

    /**
     * Состояние загрузки стилей.
     * false - не загружены или еще небыли предоставлены для загрузки
     * true - скрипты загружены
     **/
    //var loadStyleState = false;

    /**
     * Метод вызывается при загрузке заданного списка скриптов.
     * Выполняется, когда счетсик загруженных
     * скриптов становится равен нулю.
     * Данный обработчик может быть установлен из вне.
     **/
    var onLoadAction = function(){};

    // Watch scripts load in IE
    function stateChange() {
        // Execute as many scripts in order as we can
        var pendingScript;
        while (pendingScripts[0] && pendingScripts[0].readyState == 'loaded') {
            pendingScript = pendingScripts.shift();
            // avoid future loading events from this script (eg, if src changes)
            pendingScript.onreadystatechange = null;
            // can't just appendChild, old IE bug if element isn't closed
            firstScript.parentNode.insertBefore(pendingScript, firstScript);
        }
    }

    function startLoad() {
        // loop through our script urls
        while (src = scripts.shift()) {
            if ('async' in firstScript) { // modern browsers
                script = document.createElement('script');
                script.onload = onLoadHandler;
                script.async = false;
                script.src = src;
                document.head.appendChild(script);
                countOfLoad++;
            }
            else if (firstScript.readyState) { // IE<10
                // create a script and add it to our todo pile
                script = document.createElement('script');
                pendingScripts.push(script);
                // listen for state changes
                script.onreadystatechange = stateChange;
                script.onload = onLoadHandler;
                // must set src AFTER adding onreadystatechange listener
                // else we’ll miss the loaded event for cached scripts
                script.src = src;
                countOfLoad++;
            }
            else { // fall back to defer
                // TODO: WTF???
                //script.onload = onLoadHandler;
                document.write('<script src="' + src + '" defer></'+'script>');
                countOfLoad++;
            }
        }
    }

    function startLoadStyles () {
        var style;

        while (src = styles.shift()) {
            style = document.createElement('link');
            style.onload = onLoadHandler;
            style.rel = "stylesheet";
            style.href = src;
            document.head.appendChild(style);
            countOfLoad++;
        }

    }

    /**
     * Обработчик загрузки отдельного скрипта
     **/
    function onLoadHandler() {
        countOfLoad--;
        if (countOfLoad === 0) {
            // Все подключенные скрипты загружены
            loadState = true;
            onLoadAction();
        }
    }

    root.AppLoader = (function() {

        /**
         * Добавляет список скриптов в загрузчик и
         * инициирует его загрузку.
         * @param scriptList Список скриптов для загрузки
         **/
        this.addForLoad = function (scriptsList) {
            loadState = false;      // Обнуляем статус загрузки
            scripts = scripts.concat(scriptsList);
            startLoad();
            return this;
        };

        /**
         * Алиас метода загрузки скриптов
         **/
        this.scripts = this.addForLoad;

        /**
         * Добавляет список стилей в загрузчик и
         * инициирует его загрузку.
         * @param scriptList Список скриптов для загрузки
         **/
        this.styles = function (styleList) {
            loadState = false;
            styles = styles.concat(styleList);
            startLoadStyles();
            return this;
        };

        /**
         * Метод будет запущен по окончанию загрузки
         * списка скриптов
         * @param callback Обработчик события загрузки списка скриптов
         **/
        this.afterLoad = function (callback) {
            onLoadAction = callback;
            // Если скрипты уже были загружены - инициируем afterLoad-обработчик
            if (loadState === true) {
                onLoadAction();
            }
            return this;
        };

        return this;

    })();

})(window);
