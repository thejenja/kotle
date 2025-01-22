// ==UserScript==
// @name         Kotle for OpenVK
// @namespace    https://github.com/thejenja/kotle
// @version      1.0
// @description  Tweakes for OpenVK
// @author       deepseek (AI) & thejenja
// @match        https://ovk.to/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/thejenja/kotle/refs/heads/main/kotle.user.js
// @downloadURL  https://raw.githubusercontent.com/thejenja/kotle/refs/heads/main/kotle.user.js
// ==/UserScript==

(function () {
    'use strict';

    // Utility functions
    const u = (selector) => document.querySelector(selector);
    const uAll = (selector) => document.querySelectorAll(selector);

    // Default settings
    const defaultSettings = {
    debugMode: true, // Включаем отладочные сообщения по умолчанию
    buttonPlacement: 'sidebar', // sidebar, footer, header
    tweaks: {
        miniplayer: false,
        reorderGifts: false,
        removePronouns: false,
        reorderSections: false,
        renameSections: false,
        removeOpenVKTitle: false,
        oldSubsAndGiftsOrder: false,
        addAllFeedLink: false,
    },
};

  function debugLog(...args) {
    const settings = loadSettings();
    if (settings.debugMode) {
        console.log(...args);
    }
}

function debugWarn(...args) {
    const settings = loadSettings();
    if (settings.debugMode) {
        console.warn(...args);
    }
}

function debugError(...args) {
    const settings = loadSettings();
    if (settings.debugMode) {
        console.error(...args);
    }
}

    // Load settings from localStorage
    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem('tweaksSettings');
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                if (parsedSettings.buttonPlacement && parsedSettings.tweaks) {
                    return parsedSettings;
                }
            }
        } catch (e) {
            console.error('Error loading settings:', e);
        }
        return defaultSettings;
    }

    // Save settings to localStorage
    function saveSettings(settings) {
        localStorage.setItem('tweaksSettings', JSON.stringify(settings));
    }

    // Inject elements (styles, scripts, buttons)
    function injectElement(type, content, options = {}) {
        const element = document.createElement(type === 'style' ? 'style' : 'script');
        element.id = options.id || `custom${type.charAt(0).toUpperCase() + type.slice(1)}`;
        if (type === 'style') {
            element.innerHTML = content;
            document.head.appendChild(element);
        } else if (type === 'script') {
            element.textContent = content;
            document.body.appendChild(element);
        } else if (type === 'button') {
            const button = document.createElement('a');
            button.id = options.id || 'customButton';
            button.className = 'link';
            button.href = options.href || '#';
            button.innerHTML = content;
            if (options.selector) {
                u(options.selector).appendChild(button);
            }
        }
    }

    // Inject tweaks settings content
    function injectTweaksContent() {
        const pageContent = u('.page_content');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <div class="audiosDiv">
                <div class="audiosContainer audiosSideContainer audiosPaddingContainer">
                    <div class="tweaksContent">
                        ${getTabContent(new URLSearchParams(window.location.search).get('tab'))}
                    </div>
                </div>
                <div class="verticalGrayTabsWrapper">
                    <div class="verticalGrayTabs">
                        <div class="with_padding">
                            <a href="/settings?act=tweaks&tab=general" class="tabLink">Основные</a>
                            <a href="/settings?act=tweaks&tab=styles" class="tabLink">Стили</a>
                            <a href="/settings?act=tweaks&tab=scripts" class="tabLink">Скрипты</a>
                            <hr>
                            <a href="/settings?act=tweaks&tab=advanced" class="tabLink">Дополнительно</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for tabs
        uAll('.verticalGrayTabs a.tabLink').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.router.route({ url: link.href });
            });
        });

        highlightActiveTab();
        applyTabSettings();
    }

    // Highlight the active tab
    function highlightActiveTab() {
        const currentTab = new URLSearchParams(window.location.search).get('tab') || 'general';
        const tabs = uAll('.verticalGrayTabs a.tabLink');

        tabs.forEach(tab => tab.removeAttribute('id'));

        tabs.forEach(tab => {
            try {
                const tabUrl = new URL(tab.href, window.location.origin);
                const tabParam = tabUrl.searchParams.get('tab') || 'general';
                if (tabParam === currentTab) {
                    tab.id = 'used';
                }
            } catch (e) {
                console.error('Error processing tab:', tab, e);
            }
        });
    }

    const tweaksConfig = {
    miniplayer: {
        name: 'Миниплеер как в 2015',
        type: 'checkbox',
        key: 'miniplayer',
        handler: (enabled) => {
            removeInjectedElements(); // Удаляем старые элементы
            if (enabled) {
                injectElement('style', `
                .page_body{
                    anchor-name: --navigation
                }

                .scrolled #ajax_audio_player{
                    position: fixed;
                    top: 10px !important
                }
                #ajax_audio_player {
                    position-anchor: --navigation;
                    top: calc(anchor(top) + 10px) !important;
                    left: calc(anchor(right) + 10px) !important;
                    width: 200px;
                    height: max-content;
                    #aj_player_track_length, #aj_player_volume, #aj_player_buttons{
                        display: none
                    }
                    #aj_player_track_title{
                        display: flex;
                        flex-direction: column;
                        font-size: 0;
                        width: 100%;
                    }
                    b, span{
                        font-size: 12px;
                        text-overflow: ellipsis;
                    }
                    #aj_player_track_name {
                        flex-direction: column;
                    }
                }
                `, { id: 'miniplayerStyle' });
            }
        },
    },
    removePronouns: {
        name: 'Убрать "Мои" у разделов',
        type: 'checkbox',
        key: 'removePronouns',
        handler: (enabled) => {
            if (enabled) {
                injectElement('script', `
                    (function() {
                        'use strict';
                        const navigationLinks = document.querySelectorAll('.navigation a');
                        navigationLinks.forEach(link => {
                            const linkText = link.childNodes[0].textContent.trim();
                            if (linkText.startsWith('Мои') || linkText.startsWith('My') || linkText.startsWith('Мої')) {
                                link.childNodes[0].textContent = linkText.slice(3);
                            }
                        });
                    })();
                `, { id: 'removePronounsScript' });
            }
        },
    },
    reorderSections: {
        name: 'Изменить порядок разделов',
        type: 'checkbox',
        key: 'reorderSections',
        handler: (enabled) => {
            if (enabled) {
                injectElement('script', `
                    (function() {
                        'use strict';
                        const navigation = document.querySelector('.navigation');
                        const elementsToMove = [
                            '.link[accesskey="."]',
                            '.link[href="/feed"]',
                            '.link[href="/im"]',
                            '.link[href^="/friends"]',
                            '.link[href^="/groups"]',
                            '.link[href^="/albums"]'
                        ];
                        elementsToMove.reverse().forEach(selector => {
                            const element = navigation.querySelector(selector);
                            if (element) {
                                navigation.prepend(element);
                            }
                        });
                    })();
                `, { id: 'reorderSectionsScript' });
            }
        },
    },
    renameSections: {
        name: 'Переименовать разделы',
        type: 'checkbox',
        key: 'renameSections',
        handler: (enabled) => {
            if (enabled) {
                injectElement('script', `
                    (function() {
                        'use strict';
                        const renameSections = [
                            { selector: '.navigation .link[href^="/im"]', oldName: 'Сообщения', newName: 'Мессенджер' },
                            { selector: '.navigation .link[href^="/groups"]', oldName: 'Группы', newName: 'Сообщества' },
                            { selector: '.navigation .link[href^="/video"]', oldName: 'Видеозаписи', newName: 'Видео' },
                            { selector: '.navigation .link[href^="/audios"]', oldName: 'Аудиозаписи', newName: 'Музыка' },
                            { selector: '.navigation .link[href="/apps?act=installed"]', oldName: 'Приложения', newName: 'Сервисы' }
                        ];
                        renameSections.forEach(({ selector, oldName, newName }) => {
                            const link = document.querySelector(selector);
                            if (link && link.textContent.includes(oldName)) {
                                link.textContent = newName;
                            }
                        });
                    })();
                `, { id: 'renameSectionsScript' });
            }
        },
    },
    removeOpenVKTitle: {
        name: 'Убрать "OpenVK" из заголовка',
        type: 'checkbox',
        key: 'removeOpenVKTitle',
        handler: (enabled) => {
            if (enabled) {
                injectElement('script', `
                    (function() {
                        'use strict';
                        const title = document.title;
                        if (title.includes("- OpenVK")) {
                            document.title = title.replace("- OpenVK", "");
                        }
                    })();
                `, { id: 'removeOpenVKTitleScript' });
            }
        },
    },
    oldSubsAndGiftsOrder: {
        name: 'Старое положение "Подарков"',
        type: 'checkbox',
        key: 'oldSubsAndGiftsOrder',
        handler: (enabled) => {
            if (enabled) {
                injectElement('script', `
                    (function() {
                        'use strict';

                        const containerToMove1 = document.querySelector('div.right_big_block > div:has(.cl_element[style="width: 25%;"])');
                        const targetElement1 = document.querySelector('div.left_small_block > div:nth-child(4):has(.content_list)');
                        if (containerToMove1 && targetElement1) {
                            targetElement1.parentNode.insertBefore(containerToMove1, targetElement1);
                        }

                        const containerToMove2 = document.querySelector('div.left_big_block > div:nth-child(3):has(.content_list.long)');
                        const targetElement2 = document.querySelector('div.right_small_block > div:nth-child(3):has(div[style="padding:4px"])');
                        if (containerToMove2 && targetElement2) {
                            targetElement2.parentNode.insertBefore(containerToMove2, targetElement2);
                            // Удаляем класс .long у всех элементов внутри перемещённого контейнера
                            containerToMove2.querySelectorAll('.long').forEach(element => {
                                element.classList.remove('long');
                            });
                        }

                        const container = document.querySelector('.content_list');
                        if (container) {
                            const elements = container.querySelectorAll('.cl_element');
                            for (let i = 2; i < elements.length; i++) {
                                elements[i].remove();
                            }
                        }
                    })();
                `, { id: 'oldSubsAndGiftsOrderScript' });
            }
        },
    },
    buttonPlacement: {
        name: 'Расположение кнопки',
        type: 'select',
        key: 'buttonPlacement',
        options: [
            { value: 'sidebar', label: 'Сайдбар' },
            { value: 'footer', label: 'Футер' },
            { value: 'header', label: 'Замена "пригласить"' }, // Новый вариант
        ],
        handler: (value) => {
            injectButton(value);
        },
    },
    addAllFeedLink: {
        name: 'Добавить ссылку "все" в Мои Новости',
        type: 'checkbox',
        key: 'addAllFeedLink',
        handler: (enabled) => {
            const existingLink = u('.kotle-all-feed-link');
            if (existingLink) existingLink.remove();

            if (enabled) {
                const feedLink = u('.navigation a.link[href="/feed"]');
                if (feedLink) {
                    const allLink = document.createElement('a');
                    allLink.className = 'link edit-button kotle-all-feed-link';
                    allLink.href = '/feed/all';
                    allLink.innerHTML = 'все';
                    feedLink.parentNode.insertBefore(allLink, feedLink);
                }
            }
        },
    },
    debugMode: {
        name: 'Режим отладки',
        type: 'checkbox',
        key: 'debugMode',
        handler: (enabled) => {
            // Ничего не делаем, просто сохраняем настройку
        },
    },
};

  const tabs = {
    styles: {
        title: 'Настройки стилей',
        tweaks: ['miniplayer'], // Твики для вкладки "Стили"
    },
    scripts: {
        title: 'Настройки скриптов',
        tweaks: [
            'removePronouns',
            'reorderSections',
            'renameSections',
            'removeOpenVKTitle',
            'oldSubsAndGiftsOrder',
            'addAllFeedLink',
        ], // Твики для вкладки "Скрипты"
    },
    default: {
        title: 'Основные настройки',
        tweaks: ['buttonPlacement'], // Твики для вкладки "Основные"
    },
    advanced: {
        title: 'Дополнительно',
        tweaks: ['debugMode'], // Добавляем debugMode в "Дополнительно"
    },
};

    // Get content for the selected tab
    function getTabContent(tab) {

    const tabConfig = tabs[tab] || tabs.default;
    const tweaksHTML = tabConfig.tweaks
        .map((tweakKey) => {
            const tweak = tweaksConfig[tweakKey];
            if (!tweak) return '';

            let inputHTML = '';
            if (tweak.type === 'checkbox') {
                inputHTML = `
                    <td width="120" valign="top">
                        <input type="checkbox" name="${tweak.key}">
                    </td>
                    <td>
                        <span class="nobold">${tweak.name}</span>
                    </td>
                `;
            } else if (tweak.type === 'select') {
                const optionsHTML = tweak.options
                    .map((option) => `<option value="${option.value}">${option.label}</option>`)
                    .join('');
                inputHTML = `
                    <td width="120" valign="top">
                        <span class="nobold">${tweak.name}</span>
                    </td>
                    <td>
                        <select name="${tweak.key}">${optionsHTML}</select>
                    </td>
                `;
            }

            return `
                <tr>
                    ${inputHTML}
                </tr>
            `;
        })
        .join('');

    return `
        <h4>${tabConfig.title}</h4>
        <form id="${tab}Form">
            <table cellspacing="7" cellpadding="0" width="60%" border="0" align="center">
                <tbody>
                    ${tweaksHTML}
                    <tr>
                      <td></td>
                        <td colspan="2">
                            <input type="submit" value="Сохранить" class="button">
                        </td>
                    </tr>
                </tbody>
            </table>
        </form>
    `;
}

    // Apply settings for the current tab
    function applyTabSettings() {
    const settings = loadSettings();
    const tab = new URLSearchParams(window.location.search).get('tab') || 'general';

    const tabs = {
        styles: ['miniplayer'], // Добавляем стили
        scripts: [
            'removePronouns',
            'reorderSections',
            'renameSections',
            'removeOpenVKTitle',
            'oldSubsAndGiftsOrder',
            'addAllFeedLink',
        ],
        default: ['buttonPlacement'],
    };

    const tweaksToApply = tabs[tab] || tabs.default;

    const form = document.getElementById(`${tab}Form`);
    if (form) {
        // Устанавливаем значения элементов формы
        tweaksToApply.forEach((tweakKey) => {
            const tweak = tweaksConfig[tweakKey];
            if (!tweak) return;

            const input = form.querySelector(`[name="${tweak.key}"]`);
            if (input) {
                if (tweak.type === 'checkbox') {
                    // Проверяем, есть ли настройка в tweaks
                    if (settings.tweaks && tweak.key in settings.tweaks) {
                        input.checked = settings.tweaks[tweak.key]; // Устанавливаем состояние checkbox
                    } else {
                        input.checked = false; // По умолчанию выключен
                    }
                } else if (tweak.type === 'select') {
                    input.value = settings[tweak.key];
                }
            }
        });

        // Обработка отправки формы
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            tweaksToApply.forEach((tweakKey) => {
                const tweak = tweaksConfig[tweakKey];
                if (!tweak) return;

                const input = form.querySelector(`[name="${tweak.key}"]`);
                if (input) {
                    const value = tweak.type === 'checkbox' ? input.checked : input.value;
                    if (tweak.key in settings.tweaks) {
                        settings.tweaks[tweakKey] = value; // Сохраняем значение в настройки
                    } else {
                        settings[tweakKey] = value;
                    }
                    tweak.handler(value); // Применяем изменения
                }
            });

            saveSettings(settings);
            showSuccessMessage();

            // Обновляем URL без дублирования параметров
            const url = new URL(window.location.href);
            url.searchParams.delete('buttonPlacement'); // Удаляем старые параметры
            url.searchParams.set('buttonPlacement', settings.buttonPlacement); // Добавляем новый параметр
            window.history.replaceState(null, '', url.toString());

            // Применяем новое размещение кнопки
            injectButton(settings.buttonPlacement);
        });
    }
}

    // Show success message
    function showSuccessMessage() {
        const existingMsg = u('.msg_succ');
        if (existingMsg) existingMsg.remove();

        const successMsg = document.createElement('div');
        successMsg.className = 'msg msg_succ';
        successMsg.innerHTML = '<b>Изменения сохранены</b><br>Новые твики появятся на вашей странице';

        const pageContent = u('.page_content');
        if (pageContent) {
            pageContent.insertBefore(successMsg, pageContent.firstChild);
            setTimeout(() => successMsg.remove(), 5000);
        }
    }

function removeInjectedElements() {
    // Удаляем стили
    u('#miniplayerStyle')?.remove();

    // Удаляем скрипты
    u('#removePronounsScript')?.remove();
    u('#reorderSectionsScript')?.remove();
    u('#renameSectionsScript')?.remove();
    u('#removeOpenVKTitleScript')?.remove();
    u('#oldSubsAndGiftsOrderScript')?.remove();
}

    // Apply tweaks based on settings
    function applyTweaks() {
    const settings = loadSettings();
    removeInjectedElements(); // Удаляем старые стили и скрипты
    injectButton(settings.buttonPlacement); // Применяем текущее размещение кнопки

    // Применяем все твики, включая стили
    Object.entries(tweaksConfig).forEach(([key, tweak]) => {
        const value = settings.tweaks[key] || settings[key];
        if (value !== undefined) {
            tweak.handler(value); // Применяем настройку
        }
    });

    // Отладочное сообщение
    if (settings.debugMode) {
        debugLog('Applied tweaks:', settings.tweaks);
    }
}

    // Inject the custom button based on settings
    let originalInviteButton = null; // Храним исходное состояние кнопки "пригласить"

function injectButton(placement) {
    // Удаляем кнопку "твики" и разделитель, если они есть
    u('#customButton')?.remove();
    u('#customDivider')?.remove();

    // Восстанавливаем кнопку "приглатить", если она была заменена
    if (originalInviteButton) {
        const inviteLinkContainer = u('.header_navigation .link a[href="/settings?act=tweaks"]')?.parentElement;
        if (inviteLinkContainer) {
            inviteLinkContainer.innerHTML = originalInviteButton;
            originalInviteButton = null; // Сбрасываем сохранённое состояние
            debugLog('Invite button restored');
        }
    }

    const buttonHTML = placement === 'header'
        ? '<a href="/settings?act=tweaks" id="customButton">kotle</a>' // Без класса .link для header
        : '<a href="/settings?act=tweaks" id="customButton" class="link">Настройки Kotle</a>'; // С классом .link для sidebar и footer

    const dividerHTML = '<div class="menu_divider" id="customDivider"></div>';

    if (placement === 'sidebar') {
        const sidebarNavigation = u('.sidebar .navigation');
        if (sidebarNavigation) {
            const lastLink = u('.sidebar .navigation .link:last-of-type');
            if (lastLink) {
                lastLink.insertAdjacentHTML('afterend', buttonHTML);
                lastLink.insertAdjacentHTML('afterend', dividerHTML);
                debugLog('Button injected into sidebar');
            }
        }
    } else if (placement === 'footer') {
        const footerNavigation = u('.navigation_footer');
        if (footerNavigation) {
            footerNavigation.insertAdjacentHTML('beforeend', buttonHTML);
            debugLog('Button injected into footer');
        }
    } else if (placement === 'header') {
        const headerNavigation = u('.header_navigation');
        if (headerNavigation) {
            // Ищем контейнер с ссылкой "пригласить"
            const inviteLinkContainer = u('.header_navigation .link a[href="/invite"]')?.parentElement;
            if (inviteLinkContainer) {
                // Сохраняем исходное состояние кнопки "приглатить"
                originalInviteButton = inviteLinkContainer.innerHTML;
                // Заменяем содержимое контейнера
                inviteLinkContainer.innerHTML = buttonHTML;
                debugLog('Button injected into header, invite button saved');
            } else {
                // Если ссылка "пригласить" отсутствует, ищем пустой контейнер .link
                const emptyLinkContainer = u('.header_navigation .link:empty');
                if (emptyLinkContainer) {
                    emptyLinkContainer.innerHTML = buttonHTML;
                    debugLog('Button injected into empty link container in header');
                } else {
                    // Если пустого контейнера нет, добавляем новый .link с кнопкой
                    const newLinkContainer = document.createElement('div');
                    newLinkContainer.className = 'link';
                    newLinkContainer.innerHTML = buttonHTML;
                    headerNavigation.appendChild(newLinkContainer);
                    debugLog('New link container created in header');
                }
            }
        }
    }

    // Добавляем обработчик клика на кнопку "твики"
    const button = u('#customButton');
    if (button) {
        button.addEventListener('click', e => {
            e.preventDefault();
            window.router.route({ url: button.href });
        });
    }
}

  if (window.router && window.router.__appendPage) {
    const originalAppendPage = window.router.__appendPage;
    window.router.__appendPage = function (parsed_content) {
        originalAppendPage.call(this, parsed_content);
        debugLog('AJAX page loaded, reapplying tweaks...');
        applyTweaks(); // Повторно применяем твики после AJAX-загрузки

        initialize();
        highlightActiveTab();
    };
}
    // Hook into AJAX router to re-apply tweaks after page updates
    // Хук на AJAX-загрузку страницы
if (window.router && window.router.__appendPage) {
    const originalAppendPage = window.router.__appendPage;
    window.router.__appendPage = function (parsed_content) {
        originalAppendPage.call(this, parsed_content);

        debugLog('AJAX page loaded, reapplying tweaks...'); // Отладочное сообщение

        // Повторно применяем твики
        applyTweaks();

        // Инициализируем скрипт и выделяем активную вкладку
        initialize();
        highlightActiveTab();

        // Защищаем кнопку "твики" от перезаписи
        const settings = loadSettings();
        if (settings.buttonPlacement === 'header') {
            const inviteLinkContainer = u('.header_navigation .link a[href="/invite"]')?.parentElement;
            if (inviteLinkContainer && !u('#customButton')) {
                inviteLinkContainer.innerHTML = `<a href="/settings?act=tweaks" id="customButton">твики</a>`;
                debugLog('Button re-injected into header after AJAX update');
            }
        }
    };
}

// Улучшенная функция initialize
function initialize() {
    debugLog('Initializing script'); // Отладочное сообщение

    const settings = loadSettings();

    // Применяем настройки buttonPlacement при загрузке страницы
    const urlParams = new URLSearchParams(window.location.search);
    const buttonPlacement = urlParams.get('buttonPlacement') || settings.buttonPlacement;

    injectButton(buttonPlacement);
    applyTweaks(); // Применяем все твики, включая стили

    // Если мы на странице настроек твиков, injectTweaksContent
    if (window.location.pathname === '/settings' && urlParams.get('act') === 'tweaks') {
        injectTweaksContent();
    }

    // Добавляем больше отладочных сообщений
    if (settings.debugMode) {
        debugLog('Current settings:', settings);
        debugLog('Button placement:', buttonPlacement);
    }
}

    // Initial setup
    initialize();
})();

(function () {
    'use strict';

    // Конфигурация ролей и пользователей
    const roles = {
        designer: {
            users: ['theme'], // Пользователи с ролью администратора
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAALBAMAAABWnBpSAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAABtQTFRFAAAAVEYpSz8kXE4tdWM5VEYpdWM5VEYpQzgg7sNflQAAAAl0Uk5TAP////8GEBP/nBnphAAAADlJREFUeJxjZIAARmy00DswzWy3H0yb/LnAwMj6O/nBXqB8wYyaPw0gdc1TX4DVN24/AaY7fgCFGQDVtBAMl4cDBwAAAABJRU5ErkJggg==' // Ссылка на изображение для администраторов
        },
        crown: {
            users: ['thejenja', 'dm'], // Пользователи с ролью модератора
            image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAALBAMAAABWnBpSAAAAAXNSR0IB2cksfwAAAAlwSFlzAAALEwAACxMBAJqcGAAAABtQTFRFAAAASz8kSz8kXE4tSz8kSz8kdWM5VEYpQzggzPxwTAAAAAl0Uk5TAP8B/wYF////r7wevwAAAC9JREFUeJxjZIAARnRa6B2Q+M/AaMh/8QvPewZGs9uhq8NmAmkDoDgeugOku4IBAP8rDQx2KBC0AAAAAElFTkSuQmCC' // Ссылка на изображение для модераторов
        }
    };

    // Селекторы для поиска элементов
    const selectors = {
        profile: '.page_yellowheader', // Селектор для заголовка профиля
        postAuthor: '.post-author a[href^="/"] b.post-author-name', // Селектор для автора поста
        messageAuthor: 'td a[href^="/"] b' // Селектор для автора сообщения
    };

    // Функция для добавления галочек
    function applyCustomCheckmarks() {
        // Для заголовка профиля
        const profileHeader = document.querySelector(selectors.profile);
        if (profileHeader) {
            const username = window.location.pathname.split('/')[1]; // Извлекаем имя пользователя из URL
            const role = getRoleForUser(username);
            if (role && !profileHeader.querySelector('.custom-checkmark')) {
                profileHeader.append(createCheckmarkElement(role));
            }
        }

        // Для авторов постов
        document.querySelectorAll(selectors.postAuthor).forEach(author => {
            const href = author.closest('a').getAttribute('href').trim(); // Получаем href
            const username = href.split('/')[1]; // Извлекаем имя пользователя
            const role = getRoleForUser(username);
            if (role && !author.querySelector('.custom-checkmark')) {
                author.append(createCheckmarkElement(role));
            }
        });

        // Для авторов сообщений
        document.querySelectorAll(selectors.messageAuthor).forEach(author => {
            const href = author.closest('a').getAttribute('href').trim(); // Получаем href
            const username = href.split('/')[1]; // Извлекаем имя пользователя
            const role = getRoleForUser(username);
            if (role && !author.querySelector('.custom-checkmark')) {
                author.append(createCheckmarkElement(role));
            }
        });
    }

    // Функция для получения роли пользователя
    function getRoleForUser(username) {
        for (const [role, data] of Object.entries(roles)) {
            if (data.users.includes(username)) {
                return { type: role, image: data.image };
            }
        }
        return null; // Если пользователь не найден
    }

    // Функция для создания элемента галочки
    function createCheckmarkElement(role) {
        const img = document.createElement('img');
        img.className = 'custom-checkmark';
        img.src = role.image;
        img.alt = role.type;
        img.title = role.type;
        img.style.verticalAlign = 'top';
        return img;
    }

    // Добавляем стили для галочек
    const style = document.createElement('style');
    style.id = 'checkmarkStyles';
    style.textContent = `
        .custom-checkmark {
            display: inline-block;
            vertical-align: middle;
            margin-left: 5px;
        }
    `;
    document.head.append(style);

    // Применяем галочки при загрузке страницы
    applyCustomCheckmarks();

    // Отслеживаем изменения DOM для AJAX-навигации
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                applyCustomCheckmarks();
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
