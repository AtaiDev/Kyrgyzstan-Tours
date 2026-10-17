SITE_SETTINGS = {
    "site_name": "Kyrgyzstan-Tours",
    "default_language": "en",
    "email": "hello@example.com",
    "phone": "+996 000 000 000",
    "whatsapp": "+996 000 000 000",
    "telegram": "@kyrgyzstan_tours_demo",
    "instagram_url": "https://www.instagram.com/",
    "facebook_url": "",
    "youtube_url": "",
    "office": (42.8746, 74.6122),
    "og_image": "hero_glacier",
    "tr": {
        "ru": {
            "tagline": "Путешествия по Кыргызстану с местными гидами",
            "footer_text": "Небольшие группы, продуманные маршруты и уважение к природе и культуре Кыргызстана. Контактные данные на сайте — демонстрационные, замените их в административной панели.",
            "address": "Бишкек, Кыргызстан (демо-адрес)",
            "working_hours": "Пн–Сб, 09:00–19:00 (GMT+6)",
            "copyright": "Kyrgyzstan-Tours. Все права защищены.",
        },
        "en": {
            "tagline": "Journeys across Kyrgyzstan with local guides",
            "footer_text": "Small groups, thoughtful routes and respect for the nature and culture of Kyrgyzstan. Contact details on the site are placeholders — replace them in the admin panel.",
            "address": "Bishkek, Kyrgyzstan (demo address)",
            "working_hours": "Mon–Sat, 09:00–19:00 (GMT+6)",
            "copyright": "Kyrgyzstan-Tours. All rights reserved.",
        },
        "ky": {
            "tagline": "Жергиликтүү гиддер менен Кыргызстан боюнча саякаттар",
            "footer_text": "Чакан топтор, ойлонулган маршруттар жана Кыргызстандын жаратылышына, маданиятына урмат. Сайттагы байланыш маалыматтары демонстрациялык — аларды администрациялык панелден алмаштырыңыз.",
            "address": "Бишкек, Кыргызстан (демо дарек)",
            "working_hours": "Дш–Иш, 09:00–19:00 (GMT+6)",
            "copyright": "Kyrgyzstan-Tours. Бардык укуктар корголгон.",
        },
    },
}


def tr(ru, en, ky):
    return {"ru": ru, "en": en, "ky": ky}


def section_text(eyebrow, title, subtitle="", body="", primary="", secondary=""):
    return {
        "eyebrow": eyebrow,
        "title": title,
        "subtitle": subtitle,
        "body": body,
        "primary_label": primary,
        "secondary_label": secondary,
    }


HOME_SECTIONS = [
    {
        "key": "hero",
        "background": "hero_video_poster",
        "background_video": "hero_video",
        "background_video_light": "hero_video_light",
        "primary_link": "/destinations",
        "secondary_link": "/guides",
        "items_limit": 5,
        "tr": tr(
            section_text("Центральная Азия · Тянь-Шань", "Откройте душу Кыргызстана", "Ледники и бирюзовые озёра, юрты на летних пастбищах и гостеприимство кочевников — путешествия с местными гидами по всем семи областям страны.", "", "Выбрать направление", "Найти гида"),
            section_text("Central Asia · Tian Shan", "Discover the Soul of Kyrgyzstan", "Glaciers and turquoise lakes, yurts on summer pastures and nomadic hospitality — journeys with local guides across all seven regions of the country.", "", "Explore destinations", "Find a guide"),
            section_text("Борбордук Азия · Тянь-Шань", "Кыргызстандын жан дүйнөсүн ачыңыз", "Мөңгүлөр жана көгүлтүр көлдөр, жайлоодогу боз үйлөр жана көчмөндөрдүн меймандостугу — өлкөнүн жети облусу боюнча жергиликтүү гиддер менен саякаттар.", "", "Багытты тандоо", "Гид табуу"),
        ),
    },
    {
        "key": "regions",
        "primary_link": "/destinations",
        "tr": tr(
            section_text("Семь областей", "Путешествие по карте Кыргызстана", "Выберите область, чтобы узнать о её природе, главных местах и маршрутах.", "", "Все направления"),
            section_text("Seven regions", "A journey across the map of Kyrgyzstan", "Choose a region to discover its nature, highlights and routes.", "", "All destinations"),
            section_text("Жети облус", "Кыргызстандын картасы боюнча саякат", "Облустун жаратылышы, негизги жерлери жана маршруттары менен таанышуу үчүн аны тандаңыз.", "", "Бардык багыттар"),
        ),
    },
    {
        "key": "journey",
        "tr": tr(
            section_text("Иммерсивное путешествие", "Полёт над горами", "Прокручивайте страницу — и вы пролетите над восемью местами Кыргызстана. Рельеф построен по цифровой модели высот Copernicus, а поверхность — настоящий летний снимок спутника Sentinel-2."),
            section_text("Immersive journey", "Fly over the mountains", "Keep scrolling to fly over eight places in Kyrgyzstan. The relief comes from the Copernicus elevation model and the surface is a real summer image from the Sentinel-2 satellite."),
            section_text("Иммерсивдүү саякат", "Тоолордун үстүнөн учуу", "Баракты жылдырып, Кыргызстандын сегиз жеринин үстүнөн учуп өтүңүз. Рельеф Copernicus бийиктик моделинен, ал эми бети — Sentinel-2 спутнигинин чыныгы жайкы сүрөтү."),
        ),
    },
    {
        "key": "destinations",
        "primary_link": "/destinations",
        "items_limit": 5,
        "tr": tr(
            section_text("Куда поехать", "Популярные направления", "От зелёной столицы до высокогорных джайлоо — места, с которых стоит начать знакомство со страной.", "", "Все направления"),
            section_text("Where to go", "Popular destinations", "From the green capital to high mountain pastures — the places to begin your acquaintance with the country.", "", "All destinations"),
            section_text("Кайда баруу керек", "Популярдуу багыттар", "Жашыл борбордон бийик жайлоолорго чейин — өлкө менен таанышууну баштоого татыктуу жерлер.", "", "Бардык багыттар"),
        ),
    },
    {
        "key": "tours",
        "primary_link": "/tours",
        "items_limit": 6,
        "tr": tr(
            section_text("Экскурсии", "Лучшие экскурсии", "Однодневные поездки и многодневные путешествия с проверенными программами.", "", "Все экскурсии"),
            section_text("Excursions", "Handpicked excursions", "Day trips and multi-day journeys with carefully designed itineraries.", "", "All tours"),
            section_text("Экскурсиялар", "Мыкты экскурсиялар", "Бир күндүк сапарлар жана ойлонулган программалары бар көп күндүк саякаттар.", "", "Бардык экскурсиялар"),
        ),
    },
    {
        "key": "guides",
        "primary_link": "/guides",
        "items_limit": 4,
        "tr": tr(
            section_text("Команда гидов", "Профессиональные местные гиды", "Люди, которые выросли в этих горах и знают каждую тропу.", "", "Все гиды"),
            section_text("Our guides", "Professional local guides", "People who grew up in these mountains and know every trail.", "", "All guides"),
            section_text("Гиддер", "Кесипкөй жергиликтүү гиддер", "Бул тоолордо чоңоюп, ар бир жолду билген адамдар.", "", "Бардык гиддер"),
        ),
    },
    {
        "key": "routes",
        "primary_link": "/routes",
        "items_limit": 4,
        "tr": tr(
            section_text("Маршруты", "Популярные маршруты", "Готовые линии путешествий, которые можно пройти с гидом или взять за основу собственной поездки.", "", "Все маршруты"),
            section_text("Routes", "Signature routes", "Ready-made travel lines you can follow with a guide or use as the basis for your own trip.", "", "All routes"),
            section_text("Маршруттар", "Популярдуу маршруттар", "Гид менен өтүүгө же өз сапарыңыздын негизи катары алууга боло турган даяр саякат жолдору.", "", "Бардык маршруттар"),
        ),
    },
    {
        "key": "seasons",
        "tr": tr(
            section_text("Календарь путешествий", "Кыргызстан в любое время года", "У каждого сезона свои краски и маршруты."),
            section_text("Travel calendar", "Kyrgyzstan in every season", "Each season brings its own colours and routes."),
            section_text("Саякат календары", "Жылдын каалаган мезгилинде Кыргызстан", "Ар бир мезгилдин өз түстөрү жана маршруттары бар."),
        ),
    },
    {
        "key": "culture",
        "background": "shyrdak",
        "tr": tr(
            section_text("Наследие", "Живое кочевое наследие", "Традиции, которые не хранятся в музеях, а продолжают жить в юртах, на праздниках и за дастарханом."),
            section_text("Heritage", "A living nomadic heritage", "Traditions that are not kept in museums but live on in yurts, at festivals and around the dastarkhan."),
            section_text("Мурас", "Тирүү көчмөн мурасы", "Музейде сакталбаган, боз үйлөрдө, майрамдарда жана дасторкондо улантылып жаткан салттар."),
        ),
    },
    {
        "key": "nature",
        "primary_link": "/tours",
        "tr": tr(
            section_text("Природа и приключения", "Горы, которые зовут", "Более 90% территории страны занимают горы — выберите свой способ их увидеть.", "", "Подобрать тур"),
            section_text("Nature & adventure", "Mountains that call", "Mountains cover more than 90% of the country — choose your way to experience them.", "", "Find a tour"),
            section_text("Жаратылыш жана укмуштуу окуялар", "Чакырган тоолор", "Өлкөнүн аймагынын 90%дан ашыгын тоолор ээлейт — аларды көрүүнүн өз жолун тандаңыз.", "", "Тур тандоо"),
        ),
    },
    {
        "key": "stories",
        "primary_link": "/blog",
        "items_limit": 3,
        "tr": tr(
            section_text("Блог", "Истории и советы путешественникам", "Полезные статьи и впечатления о дорогах Кыргызстана.", "", "Читать блог"),
            section_text("Journal", "Stories and travel tips", "Useful articles and impressions from the roads of Kyrgyzstan.", "", "Read the journal"),
            section_text("Блог", "Окуялар жана саякатчыларга кеңештер", "Пайдалуу макалалар жана Кыргызстандын жолдорундагы таасирлер.", "", "Блогду окуу"),
        ),
    },
    {
        "key": "testimonials",
        "primary_link": "/reviews",
        "items_limit": 6,
        "tr": tr(
            section_text("Отзывы", "Что говорят путешественники", "", "", "Все отзывы"),
            section_text("Reviews", "What travellers say", "", "", "All reviews"),
            section_text("Пикирлер", "Саякатчылар эмне дешет", "", "", "Бардык пикирлер"),
        ),
    },
    {
        "key": "founder",
        "primary_link": "/about",
        "tr": tr(
            section_text("Основатель", "Слово основателя", "", "", "О нас"),
            section_text("Founder", "A word from the founder", "", "", "About us"),
            section_text("Негиздөөчү", "Негиздөөчүнүн сөзү", "", "", "Биз жөнүндө"),
        ),
    },
    {
        "key": "advantages",
        "tr": tr(
            section_text("Почему мы", "Путешествие, в котором продумано всё", ""),
            section_text("Why us", "A journey where everything is taken care of", ""),
            section_text("Эмне үчүн биз", "Баары ойлонулган саякат", ""),
        ),
    },
    {
        "key": "cta",
        "background": "son_kul_sunset",
        "primary_link": "/tours",
        "secondary_link": "/contact",
        "tr": tr(
            section_text("Начните путешествие", "Ваш Кыргызстан начинается здесь", "Расскажите о своих планах — мы подберём маршрут, гида и даты.", "", "Выбрать экскурсию", "Связаться с нами"),
            section_text("Start your journey", "Your Kyrgyzstan starts here", "Tell us about your plans — we will suggest a route, a guide and dates.", "", "Choose a tour", "Contact us"),
            section_text("Саякатты баштаңыз", "Сиздин Кыргызстан ушул жерден башталат", "Пландарыңыз жөнүндө айтып бериңиз — маршрут, гид жана даталарды сунуштайбыз.", "", "Экскурсия тандоо", "Биз менен байланышуу"),
        ),
    },
    {
        "key": "newsletter",
        "tr": tr(
            section_text("Рассылка", "Истории из гор раз в месяц", "Новые маршруты, сезонные советы и истории путешественников. Без спама — отписаться можно в любой момент."),
            section_text("Newsletter", "Stories from the mountains once a month", "New routes, seasonal tips and traveller stories. No spam — unsubscribe any time."),
            section_text("Жаңылыктар", "Айына бир жолу тоолордон окуялар", "Жаңы маршруттар, мезгилдик кеңештер жана саякатчылардын окуялары. Спамсыз — каалаган убакта баш тартууга болот."),
        ),
    },
]

HOME_SECTION_ITEMS = {
    "hero": [
        {"icon": "map", "value": "7", "tr": tr(("Областей", "", ""), ("Regions", "", ""), ("Облус", "", ""))},
        {"icon": "mountain-snow", "value": "7439", "tr": tr(("метров — высота пика Победы", "", ""), ("metres — Jengish Chokusu peak", "", ""), ("метр — Жеңиш чокусунун бийиктиги", "", ""))},
        {"icon": "waves", "value": "1600", "tr": tr(("метров — высота Иссык-Куля", "", ""), ("metres — altitude of Issyk-Kul", "", ""), ("метр — Ысык-Көлдүн бийиктиги", "", ""))},
        {"icon": "snowflake", "value": "8000+", "tr": tr(("ледников в горах страны", "", ""), ("glaciers in the mountains", "", ""), ("өлкөнүн тоолорундагы мөңгүлөр", "", ""))},
        {"icon": "mountain", "value": "90%+", "tr": tr(("территории — горы", "", ""), ("of the country is mountains", "", ""), ("аймагынын тоолор", "", ""))},
    ],
    "culture": [
        {"icon": "tent", "image": "yurt_tunduk", "link": "/blog/life-in-a-yurt", "tr": tr(("Юрта и тюндюк", "Купол юрты — символ дома, изображённый на флаге Кыргызстана.", ""), ("Yurt and tunduk", "The crown of the yurt — a symbol of home pictured on the national flag.", ""), ("Боз үй жана түндүк", "Боз үйдүн түндүгү — Кыргызстандын желегиндеги үйдүн символу.", ""))},
        {"icon": "sparkles", "image": "shyrdak", "link": "/destinations/son-kul", "tr": tr(("Шырдак", "Войлочные ковры с узорами, которые передаются из поколения в поколение.", ""), ("Shyrdak", "Felt carpets with patterns passed down through generations.", ""), ("Шырдак", "Муундан муунга өткөн оймо-чиймелүү кийиз килемдер.", ""))},
        {"icon": "music", "image": "komuz", "link": "/destinations/talas-valley", "tr": tr(("Комуз и эпос «Манас»", "Трёхструнный комуз и сказители-манасчы хранят устную историю народа.", ""), ("Komuz and the Manas epic", "The three-stringed komuz and manaschy storytellers keep the people's oral history alive.", ""), ("Комуз жана «Манас» эпосу", "Үч кылдуу комуз жана манасчылар элдин оозеки тарыхын сактап келет.", ""))},
        {"icon": "award", "image": "kok_boru", "link": "/tours?style=horseback", "tr": tr(("Кок-бору", "Конная игра, в которой проверяются сила и ловкость всадников.", ""), ("Kok-boru", "A horseback game that tests the strength and skill of riders.", ""), ("Көк бөрү", "Чабандестердин күчүн жана чеберчилигин сынаган ат оюну.", ""))},
        {"icon": "landmark", "image": "balbal_stone", "link": "/attractions/burana-tower", "tr": tr(("Балбалы", "Каменные изваяния древних тюрков у башни Бурана.", ""), ("Balbals", "Stone figures of the ancient Turks near Burana Tower.", ""), ("Балбалдар", "Бурана мунарасынын жанындагы байыркы түрктөрдүн таш эстеликтери.", ""))},
        {"icon": "utensils", "image": "boorsok_tea", "link": "/blog/kyrgyz-cuisine-guide", "tr": tr(("Дастархан", "Боорсоки, бешбармак и чай с молоком — гостеприимство начинается со стола.", ""), ("Dastarkhan", "Boorsok, beshbarmak and milk tea — hospitality begins at the table.", ""), ("Дасторкон", "Боорсок, бешбармак жана сүттүү чай — меймандостук дасторкондон башталат.", ""))},
    ],
    "nature": [
        {"icon": "footprints", "image": "ala_kul_trail", "link": "/tours?style=trekking", "tr": tr(("Треккинг", "Перевалы, ледниковые озёра и ночёвки в палатках.", ""), ("Trekking", "Passes, glacial lakes and nights in tents.", ""), ("Треккинг", "Ашуулар, мөңгү көлдөрү жана чатырда түнөө.", ""))},
        {"icon": "compass", "image": "horse_trek_valley", "link": "/tours?style=horseback", "tr": tr(("Верхом по джайлоо", "Конные маршруты вместе с пастухами.", ""), ("On horseback", "Riding routes together with herders.", ""), ("Ат менен жайлоо аралап", "Малчылар менен бирге ат маршруттары.", ""))},
        {"icon": "waves", "image": "kel_suu_lake", "link": "/tours?style=lakes", "tr": tr(("Горные озёра", "Иссык-Куль, Сон-Куль, Ала-Куль и Кель-Суу.", ""), ("Mountain lakes", "Issyk-Kul, Son-Kul, Ala-Kul and Kel-Suu.", ""), ("Тоо көлдөрү", "Ысык-Көл, Соң-Көл, Ала-Көл жана Көл-Суу.", ""))},
        {"icon": "snowflake", "image": "winter_mountains", "link": "/tours?season=winter", "tr": tr(("Зимние горы", "Горные лыжи, снегоступы и горячие источники.", ""), ("Winter mountains", "Skiing, snowshoeing and hot springs.", ""), ("Кышкы тоолор", "Тоо лыжасы, кар бутуу жана ысык булактар.", ""))},
    ],
    "advantages": [
        {"icon": "user-check", "tr": tr(("Местные гиды", "Мы работаем с гидами, которые живут в регионах, где проводят туры.", ""), ("Local guides", "We work with guides who live in the regions where they lead tours.", ""), ("Жергиликтүү гиддер", "Биз тур өткөргөн аймактарда жашаган гиддер менен иштейбиз.", ""))},
        {"icon": "users", "tr": tr(("Небольшие группы", "До 12 человек — больше внимания каждому и меньше нагрузки на природу.", ""), ("Small groups", "Up to 12 people — more attention for everyone and less impact on nature.", ""), ("Чакан топтор", "12 адамга чейин — ар бирине көбүрөөк көңүл жана жаратылышка азыраак жүк.", ""))},
        {"icon": "shield-check", "tr": tr(("Безопасность", "Продуманная логистика, связь и аптечки на каждом маршруте.", ""), ("Safety first", "Careful logistics, communication and first-aid kits on every route.", ""), ("Коопсуздук", "Ар бир маршрутта ойлонулган логистика, байланыш жана дары кутучалары.", ""))},
        {"icon": "leaf", "tr": tr(("Ответственный туризм", "Поддерживаем гостевые дома и мастеров, бережно относимся к природе.", ""), ("Responsible travel", "We support guesthouses and artisans and take care of nature.", ""), ("Жоопкерчиликтүү туризм", "Конок үйлөрүн жана усталарды колдоп, жаратылышка аяр мамиле кылабыз.", ""))},
        {"icon": "languages", "tr": tr(("Три языка", "Общаемся на русском, английском и кыргызском.", ""), ("Three languages", "We communicate in Russian, English and Kyrgyz.", ""), ("Үч тил", "Орус, англис жана кыргыз тилдеринде баарлашабыз.", ""))},
        {"icon": "wallet", "tr": tr(("Прозрачные цены", "В каждом туре указано, что включено в стоимость, а что нет.", ""), ("Transparent prices", "Every tour clearly lists what is and isn't included.", ""), ("Ачык баалар", "Ар бир турда баасына эмне кирээри жана кирбей турганы көрсөтүлгөн.", ""))},
    ],
}

ABOUT_SECTIONS = [
    {
        "key": "about_hero",
        "background": "son_kul_lake",
        "tr": tr(
            section_text("О нас", "Мы показываем Кыргызстан изнутри", "Kyrgyzstan-Tours — команда гидов и организаторов путешествий, влюблённых в горы, озёра и людей своей страны."),
            section_text("About us", "We show Kyrgyzstan from the inside", "Kyrgyzstan-Tours is a team of guides and trip organisers in love with the mountains, lakes and people of their country."),
            section_text("Биз жөнүндө", "Кыргызстанды ичинен көрсөтөбүз", "Kyrgyzstan-Tours — өз өлкөсүнүн тоолоруна, көлдөрүнө жана элине ашык болгон гиддер жана саякат уюштуруучулардын командасы."),
        ),
    },
    {
        "key": "about_story",
        "background": "son_kul_yurts",
        "tr": tr(
            section_text("История", "Как всё начиналось", "", "Демонстрационный текст: замените его в административной панели. Проект появился из небольших походов с друзьями и гостями из других стран. Со временем к нам присоединились гиды из всех регионов, и походы превратились в продуманные путешествия.\n\nСегодня мы помогаем путешественникам увидеть Кыргызстан таким, каким его знают местные жители: с утренним чаем в юрте, неспешными дорогами и историями у костра."),
            section_text("Story", "How it all began", "", "Demo text: replace it in the admin panel. The project grew out of small hikes with friends and guests from abroad. Over time guides from every region joined us, and the hikes became carefully designed journeys.\n\nToday we help travellers see Kyrgyzstan the way locals know it: with morning tea in a yurt, unhurried roads and stories by the fire."),
            section_text("Тарых", "Баары кантип башталды", "", "Демонстрациялык текст: аны администрациялык панелден алмаштырыңыз. Долбоор достор жана чет өлкөлүк коноктор менен чакан жүрүштөрдөн башталган. Убакыттын өтүшү менен бизге бардык аймактардан гиддер кошулуп, жүрүштөр ойлонулган саякаттарга айланды.\n\nБүгүн биз саякатчыларга Кыргызстанды жергиликтүү эл билгендей көрүүгө жардам беребиз: боз үйдөгү эртең мененки чай, шашылбаган жолдор жана от жанындагы аңгемелер менен."),
        ),
    },
    {
        "key": "about_mission",
        "tr": tr(
            section_text("Миссия", "Путешествия, после которых хочется вернуться", "", "Мы создаём небольшие и честные путешествия, в которых гости знакомятся не только с пейзажами, но и с людьми. Часть каждого тура остаётся в местных сообществах: в гостевых домах, у мастеров и пастушьих семей."),
            section_text("Mission", "Journeys that make you want to return", "", "We create small, honest journeys in which guests meet not only landscapes but people. Part of every tour stays in local communities: with guesthouses, artisans and herder families."),
            section_text("Миссия", "Кайра келгиң келген саякаттар", "", "Биз коноктор пейзаждар менен гана эмес, адамдар менен да таанышкан чакан жана чынчыл саякаттарды түзөбүз. Ар бир турдун бир бөлүгү жергиликтүү коомчулукта калат: конок үйлөрүндө, усталарда жана малчылардын үй-бүлөлөрүндө."),
        ),
    },
    {
        "key": "about_principles",
        "tr": tr(
            section_text("Принципы", "Как мы работаем"),
            section_text("Principles", "How we work"),
            section_text("Принциптер", "Кантип иштейбиз"),
        ),
    },
    {
        "key": "about_founder",
        "tr": tr(
            section_text("Основатель", "Главный гид проекта"),
            section_text("Founder", "The project's lead guide"),
            section_text("Негиздөөчү", "Долбоордун башкы гиди"),
        ),
    },
    {
        "key": "about_team",
        "tr": tr(
            section_text("Команда", "Люди за каждым путешествием"),
            section_text("Team", "The people behind every journey"),
            section_text("Команда", "Ар бир саякаттын артындагы адамдар"),
        ),
    },
    {
        "key": "about_contacts",
        "primary_link": "/contact",
        "tr": tr(
            section_text("Контакты", "Давайте спланируем вашу поездку", "Напишите нам — ответим в течение рабочего дня.", "", "Написать нам"),
            section_text("Contacts", "Let's plan your trip", "Write to us — we reply within one business day.", "", "Write to us"),
            section_text("Байланыш", "Сапарыңызды пландайлы", "Бизге жазыңыз — бир иш күнүнүн ичинде жооп беребиз.", "", "Бизге жазуу"),
        ),
    },
]

ABOUT_SECTION_ITEMS = {
    "about_principles": [
        {"icon": "heart", "tr": tr(("Уважение", "К природе, традициям и людям, которые нас принимают.", ""), ("Respect", "For nature, traditions and the people who welcome us.", ""), ("Урмат", "Жаратылышка, салттарга жана бизди тосуп алган адамдарга.", ""))},
        {"icon": "shield-check", "tr": tr(("Безопасность", "Опытные гиды, проверенный транспорт и план на любой случай.", ""), ("Safety", "Experienced guides, reliable transport and a plan for every situation.", ""), ("Коопсуздук", "Тажрыйбалуу гиддер, ишенимдүү транспорт жана ар кандай учурга план.", ""))},
        {"icon": "handshake", "tr": tr(("Честность", "Прозрачные цены и реалистичные описания маршрутов.", ""), ("Honesty", "Transparent prices and realistic route descriptions.", ""), ("Чынчылдык", "Ачык баалар жана маршруттардын реалдуу сүрөттөмөлөрү.", ""))},
        {"icon": "leaf", "tr": tr(("Устойчивость", "Небольшие группы и принцип «не оставляй следов».", ""), ("Sustainability", "Small groups and a leave-no-trace approach.", ""), ("Туруктуулук", "Чакан топтор жана «из калтырба» принциби.", ""))},
    ],
}

SEO_PAGES = {
    "home": tr(
        ("Kyrgyzstan-Tours — путешествия по Кыргызстану", "Экскурсии, треккинг и туры по Кыргызстану с местными гидами: Иссык-Куль, Сон-Куль, Ала-Арча, Ош и все семь областей."),
        ("Kyrgyzstan-Tours — journeys across Kyrgyzstan", "Tours, treks and excursions in Kyrgyzstan with local guides: Issyk-Kul, Son-Kul, Ala-Archa, Osh and all seven regions."),
        ("Kyrgyzstan-Tours — Кыргызстан боюнча саякаттар", "Жергиликтүү гиддер менен Кыргызстан боюнча экскурсиялар, треккинг жана турлар: Ысык-Көл, Соң-Көл, Ала-Арча, Ош жана бардык жети облус."),
    ),
    "destinations": tr(
        ("Направления — куда поехать в Кыргызстане", "Популярные направления Кыргызстана с фильтрами по области, типу отдыха и сезону."),
        ("Destinations — where to go in Kyrgyzstan", "Kyrgyzstan's popular destinations with filters by region, travel style and season."),
        ("Багыттар — Кыргызстанда кайда баруу керек", "Облус, эс алуу түрү жана мезгил боюнча чыпкалары бар Кыргызстандын популярдуу багыттары."),
    ),
    "regions": tr(
        ("Области Кыргызстана", "Семь областей Кыргызстана: природа, достопримечательности и маршруты."),
        ("Regions of Kyrgyzstan", "The seven regions of Kyrgyzstan: nature, sights and routes."),
        ("Кыргызстандын облустары", "Кыргызстандын жети облусу: жаратылыш, көрүнүктүү жерлер жана маршруттар."),
    ),
    "tours": tr(
        ("Экскурсии и туры по Кыргызстану", "Каталог экскурсий: фильтры по цене, продолжительности, региону и сложности."),
        ("Tours and excursions in Kyrgyzstan", "Tour catalogue with filters by price, duration, region and difficulty."),
        ("Кыргызстан боюнча экскурсиялар жана турлар", "Экскурсиялар каталогу: баа, узактык, аймак жана татаалдык боюнча чыпкалар."),
    ),
    "routes": tr(
        ("Маршруты по Кыргызстану", "Популярные маршруты по Кыргызстану на карте с остановками и связанными турами."),
        ("Routes across Kyrgyzstan", "Popular routes across Kyrgyzstan on the map with stops and related tours."),
        ("Кыргызстан боюнча маршруттар", "Аялдамалары жана тиешелүү турлары менен картадагы популярдуу маршруттар."),
    ),
    "guides": tr(
        ("Гиды по Кыргызстану", "Профессиональные местные гиды: языки, специализация, регионы и отзывы."),
        ("Guides in Kyrgyzstan", "Professional local guides: languages, specialisation, regions and reviews."),
        ("Кыргызстандагы гиддер", "Кесипкөй жергиликтүү гиддер: тилдер, адистик, аймактар жана пикирлер."),
    ),
    "about": tr(
        ("О нас — Kyrgyzstan-Tours", "История, миссия, принципы и команда Kyrgyzstan-Tours."),
        ("About us — Kyrgyzstan-Tours", "The story, mission, principles and team of Kyrgyzstan-Tours."),
        ("Биз жөнүндө — Kyrgyzstan-Tours", "Kyrgyzstan-Tours командасынын тарыхы, миссиясы жана принциптери."),
    ),
    "reviews": tr(
        ("Отзывы путешественников", "Отзывы гостей о турах и гидах Kyrgyzstan-Tours."),
        ("Traveller reviews", "Guest reviews of Kyrgyzstan-Tours tours and guides."),
        ("Саякатчылардын пикирлери", "Kyrgyzstan-Tours турлары жана гиддери жөнүндө коноктордун пикирлери."),
    ),
    "blog": tr(
        ("Блог о путешествиях по Кыргызстану", "Советы, культура и истории путешественников о Кыргызстане."),
        ("Kyrgyzstan travel journal", "Tips, culture and traveller stories about Kyrgyzstan."),
        ("Кыргызстан боюнча саякат блогу", "Кыргызстан жөнүндө кеңештер, маданият жана саякатчылардын окуялары."),
    ),
    "contact": tr(
        ("Контакты — Kyrgyzstan-Tours", "Свяжитесь с нами, чтобы спланировать путешествие по Кыргызстану."),
        ("Contact — Kyrgyzstan-Tours", "Get in touch to plan your journey across Kyrgyzstan."),
        ("Байланыш — Kyrgyzstan-Tours", "Кыргызстан боюнча саякатты пландоо үчүн биз менен байланышыңыз."),
    ),
    "faq": tr(
        ("Частые вопросы о путешествиях в Кыргызстан", "Ответы на вопросы о бронировании, визах, сезонах и безопасности."),
        ("Frequently asked questions", "Answers about booking, visas, seasons and safety in Kyrgyzstan."),
        ("Көп берилүүчү суроолор", "Брондоо, виза, мезгилдер жана коопсуздук боюнча суроолорго жооптор."),
    ),
    "credits": tr(
        ("Авторы фотографий", "Список фотографий, их авторов и лицензий."),
        ("Photo credits", "A list of photographs, their authors and licences."),
        ("Сүрөттөрдүн авторлору", "Сүрөттөрдүн, алардын авторлорунун жана лицензияларынын тизмеси."),
    ),
}

FAQ = [
    ("booking", tr(
        ("Как забронировать тур?", "Оставьте заявку на странице тура или в форме контактов. Мы свяжемся с вами, уточним даты и детали и пришлём подтверждение. Оплата и условия обсуждаются индивидуально."),
        ("How do I book a tour?", "Send a request from the tour page or the contact form. We will get in touch, confirm the dates and details and send a confirmation. Payment and terms are agreed individually."),
        ("Турду кантип брондосо болот?", "Турдун барагынан же байланыш формасынан арыз калтырыңыз. Биз сиз менен байланышып, даталарды жана деталдарды тактап, ырастоо жиберебиз. Төлөм жана шарттар жеке талкууланат."),
    )),
    ("travel", tr(
        ("Нужна ли виза в Кыргызстан?", "Граждане многих стран могут въехать без визы на ограниченный срок. Правила меняются, поэтому перед поездкой проверьте актуальную информацию на сайте Министерства иностранных дел Кыргызской Республики."),
        ("Do I need a visa for Kyrgyzstan?", "Citizens of many countries can enter visa-free for a limited period. Rules change, so check the current information on the website of the Ministry of Foreign Affairs of the Kyrgyz Republic before travelling."),
        ("Кыргызстанга виза керекпи?", "Көптөгөн өлкөлөрдүн жарандары чектелген мөөнөткө визасыз кире алышат. Эрежелер өзгөрүп турат, ошондуктан сапардын алдында Кыргыз Республикасынын Тышкы иштер министрлигинин сайтынан актуалдуу маалыматты текшериңиз."),
    )),
    ("travel", tr(
        ("Когда лучше ехать?", "Для треккинга и юрт — с июня по сентябрь, для городов и цветения — весной, для золотой осени — в сентябре и октябре, для горных лыж — с декабря по март."),
        ("When is the best time to go?", "For trekking and yurts — June to September, for cities and blossom — spring, for golden autumn — September and October, for skiing — December to March."),
        ("Качан барган жакшы?", "Треккинг жана боз үйлөр үчүн — июндан сентябрга чейин, шаарлар жана гүлдөө үчүн — жазында, алтын күз үчүн — сентябрь-октябрда, тоо лыжасы үчүн — декабрдан мартка чейин."),
    )),
    ("safety", tr(
        ("Насколько безопасны горные маршруты?", "Наши гиды знают маршруты и следят за погодой и самочувствием группы. Для высокогорных туров мы закладываем дни на акклиматизацию. Рекомендуем оформить страховку, покрывающую горный туризм."),
        ("How safe are the mountain routes?", "Our guides know the routes and monitor the weather and the group's wellbeing. High-altitude tours include acclimatisation days. We recommend insurance that covers mountain activities."),
        ("Тоо маршруттары канчалык коопсуз?", "Гиддерибиз маршруттарды билишет жана аба ырайын, топтун абалын көзөмөлдөшөт. Бийик тоолуу турларга климатка көнүү күндөрүн киргизебиз. Тоо туризмин камтыган камсыздандыруу алууну сунуштайбыз."),
    )),
    ("booking", tr(
        ("Можно ли изменить программу тура?", "Да. Большинство туров можно адаптировать под ваш темп, интересы и даты — напишите нам о своих пожеланиях."),
        ("Can I customise a tour?", "Yes. Most tours can be adapted to your pace, interests and dates — just tell us what you have in mind."),
        ("Тур программасын өзгөртүүгө болобу?", "Ооба. Көпчүлүк турларды ыргагыңызга, кызыкчылыктарыңызга жана даталарыңызга ылайыкташтырууга болот — каалоолоруңузду жазыңыз."),
    )),
    ("general", tr(
        ("На каких языках работают гиды?", "Все гиды говорят на кыргызском и русском, большинство — на английском. Есть гиды с немецким, французским, турецким и китайским языками."),
        ("Which languages do the guides speak?", "All guides speak Kyrgyz and Russian, most speak English. Some guides also speak German, French, Turkish or Chinese."),
        ("Гиддер кайсы тилдерде сүйлөшөт?", "Бардык гиддер кыргызча жана орусча, көпчүлүгү англисче сүйлөйт. Немис, француз, түрк жана кытай тилдерин билген гиддер да бар."),
    )),
    ("travel", tr(
        ("Какие условия в юртах?", "Юрты утеплены, в них есть кровати или матрасы и тёплые одеяла. Удобства обычно на улице, душ есть не везде. Ночью на высоте бывает холодно — возьмите тёплую одежду."),
        ("What are the conditions in yurts?", "Yurts are insulated and have beds or mattresses with warm blankets. Toilets are usually outside and showers are not always available. Nights at altitude are cold — bring warm clothes."),
        ("Боз үйлөрдө шарттар кандай?", "Боз үйлөр жылуу, ичинде керебет же төшөк жана жылуу жууркандар бар. Даараткана адатта сыртта, душ бардык жерде эле жок. Бийиктикте түнкүсүн суук болот — жылуу кийим алыңыз."),
    )),
    ("general", tr(
        ("Отправляете ли вы письма после заявки?", "Заявка сохраняется в нашей системе сразу, и менеджер связывается с вами по указанным контактам. Автоматические письма отправляются только если на сервере настроена почта."),
        ("Do you send an email after a request?", "Your request is saved in our system immediately and a manager contacts you using the details you provided. Automatic emails are sent only if email delivery is configured on the server."),
        ("Арыздан кийин кат жибересиңерби?", "Арызыңыз системабызда дароо сакталат жана менеджер сиз көрсөткөн байланыштар аркылуу кайрылат. Автоматтык каттар серверде почта жөндөлгөн учурда гана жиберилет."),
    )),
]

STATIC_PAGES = {
    "privacy": tr(
        ("Политика конфиденциальности", "*Шаблон для демонстрации. Перед публикацией сайта согласуйте текст с юристом.*\n\n## Какие данные мы собираем\n\nИмя, адрес электронной почты, телефон и сведения о поездке, которые вы указываете в формах заявки, обратной связи, отзыва и подписки.\n\n## Зачем мы их используем\n\nЧтобы ответить на ваш запрос, подготовить предложение по туру, опубликовать отзыв после модерации и отправлять рассылку, если вы на неё подписались.\n\n## Хранение и защита\n\nДанные хранятся в базе данных сайта и доступны только сотрудникам с соответствующими правами. Мы не продаём и не передаём персональные данные третьим лицам, кроме случаев, необходимых для организации поездки.\n\n## Ваши права\n\nВы можете запросить изменение или удаление своих данных, написав нам по адресу, указанному на странице контактов."),
        ("Privacy policy", "*Template for demonstration. Have the text reviewed by a lawyer before publishing the site.*\n\n## What data we collect\n\nName, email address, phone number and trip details you provide in the booking, contact, review and newsletter forms.\n\n## Why we use it\n\nTo answer your request, prepare a tour proposal, publish your review after moderation and send the newsletter if you subscribed.\n\n## Storage and protection\n\nData is stored in the site database and is accessible only to staff with the appropriate permissions. We do not sell or share personal data with third parties except where necessary to organise your trip.\n\n## Your rights\n\nYou can ask us to change or delete your data by writing to the address on the contact page."),
        ("Купуялык саясаты", "*Демонстрация үчүн шаблон. Сайтты жарыялоодон мурун текстти юрист менен макулдашыңыз.*\n\n## Кайсы маалыматтарды чогултабыз\n\nАрыз, байланыш, пикир жана жазылуу формаларында көрсөткөн атыңыз, электрондук почтаңыз, телефонуңуз жана сапар жөнүндө маалыматтар.\n\n## Аларды эмне үчүн колдонобуз\n\nСуроооңузга жооп берүү, тур боюнча сунуш даярдоо, пикириңизди модерациядан кийин жарыялоо жана жазылган болсоңуз жаңылыктарды жиберүү үчүн.\n\n## Сактоо жана коргоо\n\nМаалыматтар сайттын маалымат базасында сакталат жана тиешелүү укугу бар кызматкерлерге гана жеткиликтүү. Сапарды уюштуруу үчүн зарыл болгон учурлардан башка учурда жеке маалыматтарды сатпайбыз жана үчүнчү жактарга бербейбиз.\n\n## Сиздин укуктарыңыз\n\nБайланыш барагындагы дарекке жазып, маалыматтарыңызды өзгөртүүнү же өчүрүүнү сурансаңыз болот."),
    ),
    "terms": tr(
        ("Пользовательское соглашение", "*Шаблон для демонстрации. Перед публикацией сайта согласуйте текст с юристом.*\n\n## Общие положения\n\nИспользуя сайт, вы соглашаетесь с настоящими условиями. Информация о турах носит ознакомительный характер и уточняется при бронировании.\n\n## Заявки и бронирование\n\nОтправка заявки не является бронированием. Бронирование подтверждается после согласования программы, дат и условий оплаты с менеджером.\n\n## Изменения программы\n\nВ горах погодные и дорожные условия могут потребовать изменений маршрута. Гид вправе скорректировать программу ради безопасности группы.\n\n## Ответственность\n\nУчастники отвечают за соответствие своего здоровья выбранному маршруту и наличие страховки."),
        ("Terms of use", "*Template for demonstration. Have the text reviewed by a lawyer before publishing the site.*\n\n## General\n\nBy using the site you agree to these terms. Tour information is provided for reference and is confirmed at booking.\n\n## Requests and bookings\n\nSending a request is not a booking. A booking is confirmed after the programme, dates and payment terms are agreed with a manager.\n\n## Programme changes\n\nIn the mountains, weather and road conditions may require route changes. The guide may adjust the programme for the safety of the group.\n\n## Responsibility\n\nParticipants are responsible for making sure their health suits the chosen route and for having travel insurance."),
        ("Колдонуучу келишими", "*Демонстрация үчүн шаблон. Сайтты жарыялоодон мурун текстти юрист менен макулдашыңыз.*\n\n## Жалпы жоболор\n\nСайтты колдонуу менен бул шарттарга макул болосуз. Турлар жөнүндө маалымат таанышуу үчүн берилет жана брондоодо такталат.\n\n## Арыздар жана брондоо\n\nАрыз жөнөтүү брондоо болуп эсептелбейт. Брондоо программа, даталар жана төлөм шарттары менеджер менен макулдашылгандан кийин ырасталат.\n\n## Программанын өзгөрүшү\n\nТоодо аба ырайы жана жол шарттары маршрутту өзгөртүүнү талап кылышы мүмкүн. Гид топтун коопсуздугу үчүн программаны тууралоого укуктуу.\n\n## Жоопкерчилик\n\nКатышуучулар ден соолугунун тандалган маршрутка ылайык келишине жана камсыздандыруусунун болушуна жооптуу."),
    ),
}
