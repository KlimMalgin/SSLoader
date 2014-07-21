
/**
 * Загрузчик реализован по мотивам статьи http://habrahabr.ru/post/182310/
 * В статье так же описаны сложности, которые могут возникнуть при загрузке скриптов
 * ---------------------------------------------------------------------------------
 **/
(function (root) {

    /**
     * Массив для  перечисления загружаемых скриптов
     **/
    var scriptsQueue = [],
        pendingScripts = [],
        firstScript = document.scripts[0],
        requestedScripts = {}, // {"src.js": true}
        handlersQueue = [],//[{src1.js: true,.. length: 3, }, ...]
        src, script;

    /**
     * Счетчик загруженных скриптов.
     * При подключении скриптов на страницу инкрементируется.
     * При отработке onload-обработчика декрементируется
     **/
    var countOfLoad = 0;

    /**
     * Состояние загрузки скриптов.
     * false - не загружены или еще небыли предоставлены для загрузки
     * true - скрипты загружены
     **/
    var loadState = false;

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
        while (src = scriptsQueue.shift()) {

            if(requestedScripts[src] == 'ready'){
                onLoadHandler(src);
                continue;
            }else if(requestedScripts[src] == 'requested'){
                continue;
            }

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

            requestedScripts[src] = 'requested';
        }
    }

    /**
     * Обработчик загрузки отдельного скрипта
     **/
    function onLoadHandler(arg) {
        var src;
        if(typeof arg == 'string'){
            src = arg;
        }else{
            src = arg.target.getAttribute('src');
        }

        checkReadyItemInHandlersQueue(src);

        countOfLoad--;
        if (countOfLoad === 0) {
            // Все подключенные скрипты загружены
            loadState = true;
            onLoadAction();
        }
    }

    function prepareLoadingScriptList(scriptsList, handler){
        var newScriptsQuery = {
            handler: handler,
            length: scriptsList.length
        };
        for(var i = 0, ii = scriptsList.length; i < ii; i++){
            newScriptsQuery[scriptsList[i]] = true;
            if(requestedScripts[scriptsList[i]] === undefined){
                requestedScripts[scriptsList[i]] = 'register';
            }
        }

        handlersQueue.push(newScriptsQuery);
    }

    function checkReadyItemInHandlersQueue(itemSrc){
        var it;
        for(var i = 0, ii = handlersQueue.length; i < ii; i++){
            it = handlersQueue[i];
            if(it[itemSrc]){
                requestedScripts[itemSrc] = 'ready';
                it.length--;

                if(it.length == 0){
                    if(handlersQueue[i].handler){
                        handlersQueue[i].handler();
                    }
                    handlersQueue.splice(i, 1);
                    i--;
                    ii--;
                }
            }
        }
    }

    root.AppLoader = (function() {

        /**
         * Добавляет список скриптов в загрузчик и
         * инициирует его загрузку.
         * @param scriptList Список скриптов для загрузки
         * @param handler Обработчик завершения загрузки указанных скриптов
         **/
        this.addForLoad = function (scriptsList, handler) {
            loadState = false;      // Обнуляем статус загрузки
            prepareLoadingScriptList(scriptsList, handler);
            scriptsQueue = scriptsQueue.concat(scriptsList);
            startLoad();
            return this;
        };

        /**
         * Осуществляет подключения css-файла на страницу.
         * @param src путь к css-файлу
         **/
        this.addStyleForLoad = function(src){
            var link = document.createElement("link");
            link.type = "text/css";
            link.rel = "stylesheet";
            link.href = src;
            document.getElementsByTagName("head")[0].appendChild(link);
        };

        return this;

    })();

})(window);
