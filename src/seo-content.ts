import type { Locale } from "./i18n";
export type SeoCopy = {
  title: string;
  description: string;
  heading: string;
  intro: string;
  featuresTitle: string;
  features: string[];
  howTitle: string;
  how: string;
  faqTitle: string;
  faq: [string, string][];
  credits: string;
  languages: string;
  close: string;
  guide: string;
};
export const seoCopy: Record<Locale, SeoCopy> = {
  fr: {
    title: "lofeur : radio lofi, ambiances sonores et minuteur Pomodoro",
    description:
      "Écoutez des radios lofi et des mixes Lofi Girl, combinez pluie et bruits de nature, puis lancez un Pomodoro. Gratuit, personnalisable et sans compte.",
    heading: "Votre bureau lofi pour étudier, travailler et vous détendre",
    intro:
      "lofeur rassemble de la musique lofi, des ambiances sonores et un minuteur de concentration dans un espace calme. Choisissez une radio en direct ou une compilation, créez votre mélange de sons et avancez à votre rythme, sans compte à créer.",
    featuresTitle: "Un espace de concentration à votre rythme",
    features: [
      "Des radios lofi en direct et des compilations officielles Lofi Girl, avec favoris, recherche et stations YouTube personnalisées.",
      "Douze ambiances à mixer : pluie, forêt, plage, café, cheminée, ronronnement et autres sons de fond, avec volumes indépendants.",
      "Un minuteur Pomodoro classique de 25 minutes ou long de 50 minutes, des pauses et une alarme réglable.",
      "Un mode audio léger sans lecteur vidéo, avec des fonds procéduraux personnalisables : aurore, dégradé, pixels ou feu de cheminée.",
    ],
    howTitle: "Comment utiliser lofeur ?",
    how: "Lancez une radio, ajustez son volume et ajoutez une ambiance si vous le souhaitez. Pour travailler par sessions, démarrez le Pomodoro. Le bouton caméra active la vidéo YouTube ; désactivez-la pour retrouver le mode audio et limiter les données utilisées.",
    faqTitle: "Questions fréquentes",
    faq: [
      [
        "Faut-il créer un compte ?",
        "Non. Les stations, favoris, couleurs et réglages sont enregistrés dans votre navigateur. Vous pouvez exporter vos stations pour les conserver ou les transférer.",
      ],
      [
        "Peut-on écouter sans vidéo ?",
        "Oui, les radios utilisent leurs flux audio publics lorsque la vidéo est désactivée. Les compilations YouTube demandent le lecteur vidéo, sauf si vous fournissez un flux audio direct distinct.",
      ],
      [
        "Pourquoi une station est-elle grisée ?",
        "Sa source est signalée indisponible dans le catalogue vérifié ou a échoué à la lecture. Les directs disponibles apparaissent en premier, puis les enregistrements, puis les sources indisponibles.",
      ],
    ],
    credits:
      "lofeur est un projet indépendant, sans affiliation avec Lofi Girl. La musique et les illustrations appartiennent à leurs créateurs. Une connexion Internet reste nécessaire pour les flux et vidéos.",
    languages: "Langues disponibles",
    close: "Fermer le guide",
    guide: "À propos et mode d’emploi",
  },
  en: {
    title: "lofeur: lofi radio, ambient sounds and Pomodoro timer",
    description:
      "Listen to lofi radios and Lofi Girl mixes, blend rain and nature sounds, and focus with a Pomodoro timer. Free, customizable and no account required.",
    heading: "Your lofi desk for studying, working and winding down",
    intro:
      "lofeur brings lofi music, ambient soundscapes and a focus timer into one calm space. Pick a live radio or a recorded mix, build your own background sound and settle into your rhythm without creating an account.",
    featuresTitle: "Make room for your own rhythm",
    features: [
      "Live lofi radios and official Lofi Girl compilations, with favorites, search and custom YouTube stations.",
      "Twelve ambient sounds to blend: rain, forest, beach, café, fireplace, purring and more, each with its own volume.",
      "A classic 25-minute or extended 50-minute Pomodoro timer, breaks and an adjustable alarm.",
      "Lightweight audio-only radio with customizable procedural backdrops: aurora, flowing gradients, pixels or a fireplace.",
    ],
    howTitle: "How do I use lofeur?",
    how: "Start a radio, adjust its volume and add a soundscape if you like. Start the Pomodoro to work in sessions. The camera button enables YouTube video; turn it off to return to audio-only radio and reduce data use.",
    faqTitle: "Frequently asked questions",
    faq: [
      [
        "Do I need an account?",
        "No. Stations, favorites, colors and settings are saved in your browser. Export your stations to keep a backup or move them to another device.",
      ],
      [
        "Can I listen without video?",
        "Yes. Radios use their public audio streams when video is disabled. YouTube compilations require the video player unless you supply a separate direct audio stream.",
      ],
      [
        "Why is a station grey?",
        "Its source is marked unavailable in the verified catalog or failed during playback. Available live radios come first, recordings next, and unavailable sources last.",
      ],
    ],
    credits:
      "lofeur is an independent project with no affiliation to Lofi Girl. Music and illustrations belong to their creators. An internet connection is needed for streams and videos.",
    languages: "Available languages",
    close: "Close guide",
    guide: "About and listening guide",
  },
  es: {
    title: "lofeur: radio lofi, sonidos ambientales y temporizador Pomodoro",
    description:
      "Escucha radios lofi y mezclas de Lofi Girl, combina lluvia y sonidos de la naturaleza y concéntrate con Pomodoro. Gratis, personalizable y sin cuenta.",
    heading: "Tu escritorio lofi para estudiar, trabajar y relajarte",
    intro:
      "lofeur reúne música lofi, ambientes sonoros y un temporizador de concentración en un espacio tranquilo. Elige una radio en directo o una recopilación, mezcla tus sonidos de fondo y encuentra tu ritmo sin crear una cuenta.",
    featuresTitle: "Un espacio a tu ritmo",
    features: [
      "Radios lofi en directo y recopilaciones oficiales de Lofi Girl, con favoritos, búsqueda y emisoras de YouTube personalizadas.",
      "Doce ambientes para mezclar: lluvia, bosque, playa, cafetería, chimenea, ronroneo y más, con volúmenes independientes.",
      "Temporizador Pomodoro de 25 o 50 minutos, descansos y volumen de alarma ajustable.",
      "Radio ligera de solo audio con fondos procedurales personalizables: aurora, degradado, píxeles o chimenea.",
    ],
    howTitle: "¿Cómo se usa lofeur?",
    how: "Inicia una radio, ajusta el volumen y añade un ambiente si quieres. Activa Pomodoro para trabajar por sesiones. El botón de cámara activa el vídeo de YouTube; desactívalo para volver al audio y reducir el consumo de datos.",
    faqTitle: "Preguntas frecuentes",
    faq: [
      [
        "¿Necesito una cuenta?",
        "No. Las emisoras, los favoritos, los colores y los ajustes se guardan en tu navegador. Puedes exportar tus emisoras para conservarlas o transferirlas.",
      ],
      [
        "¿Se puede escuchar sin vídeo?",
        "Sí. Las radios usan sus flujos de audio públicos al desactivar el vídeo. Las recopilaciones de YouTube requieren vídeo, salvo que proporciones un flujo de audio directo aparte.",
      ],
      [
        "¿Por qué una emisora aparece en gris?",
        "Su fuente figura como no disponible en el catálogo verificado o ha fallado al reproducir. Primero aparecen los directos disponibles, después las grabaciones y al final las fuentes no disponibles.",
      ],
    ],
    credits:
      "lofeur es un proyecto independiente sin afiliación con Lofi Girl. La música y las ilustraciones pertenecen a sus creadores. Los flujos y vídeos requieren conexión a Internet.",
    languages: "Idiomas disponibles",
    close: "Cerrar guía",
    guide: "Acerca de y guía de escucha",
  },
  zh: {
    title: "lofeur：Lofi 电台、环境音与番茄钟",
    description:
      "收听 Lofi 电台和 Lofi Girl 合辑，自由混合雨声与自然环境音，用番茄钟安排专注时间。免费、可自定义，无需注册。",
    heading: "陪您学习、工作和放松的 Lofi 桌面",
    intro:
      "lofeur 将 Lofi 音乐、环境音和专注计时器放在同一个宁静空间。选择直播电台或录制合辑，调配喜欢的背景声音，按照自己的节奏使用，无需创建账号。",
    featuresTitle: "找到适合自己的专注节奏",
    features: [
      "Lofi 直播电台和 Lofi Girl 官方合辑，支持收藏、搜索及添加自己的 YouTube 电台。",
      "十二种可混合环境音，包括雨声、森林、海滩、咖啡馆、壁炉与猫咪呼噜，每种声音都有独立音量。",
      "25 分钟或 50 分钟番茄钟，包含休息阶段及可调节的提示音。",
      "轻量纯音频模式，配有可自定义的程序生成背景：极光、流动渐变、像素或壁炉火焰。",
    ],
    howTitle: "如何使用 lofeur？",
    how: "启动电台并调节音量，按需添加环境音。想分段工作时，可启动番茄钟。摄像机按钮用于开启 YouTube 视频；关闭后将返回纯音频模式，减少流量使用。",
    faqTitle: "常见问题",
    faq: [
      [
        "需要注册账号吗？",
        "不需要。电台、收藏、颜色和设置保存在浏览器中。您可以导出电台列表，进行备份或转移。",
      ],
      [
        "可以不播放视频吗？",
        "可以。关闭视频后，电台通过公开音频流播放。YouTube 合辑需要视频播放器，除非您另行提供音频直链。",
      ],
      [
        "为什么电台显示为灰色？",
        "其来源在已验证目录中标记为不可用，或实际播放时发生错误。可用直播排在最前，其次是录制内容，不可用来源排在最后。",
      ],
    ],
    credits:
      "lofeur 是独立项目，与 Lofi Girl 无隶属关系。音乐和插画归各自创作者所有。收听音频流和视频需要网络连接。",
    languages: "可选语言",
    close: "关闭指南",
    guide: "关于与使用指南",
  },
  hi: {
    title: "lofeur: लोफाई रेडियो, परिवेश ध्वनियाँ और पोमोडोरो टाइमर",
    description:
      "लोफाई रेडियो और Lofi Girl मिक्स सुनें, बारिश व प्रकृति की आवाज़ें मिलाएँ और पोमोडोरो से ध्यान लगाएँ। मुफ़्त, अनुकूलनीय और बिना खाते के।",
    heading: "पढ़ाई, काम और आराम के लिए आपकी लोफाई डेस्क",
    intro:
      "lofeur एक शांत जगह में लोफाई संगीत, परिवेश ध्वनियाँ और एकाग्रता का टाइमर लाता है। लाइव रेडियो या रिकॉर्ड किया हुआ मिक्स चुनें, अपनी पसंद की पृष्ठभूमि ध्वनियाँ मिलाएँ और बिना खाता बनाए अपनी लय में चलें।",
    featuresTitle: "अपनी लय के अनुसार एकाग्रता",
    features: [
      "लाइव लोफाई रेडियो और Lofi Girl के आधिकारिक मिक्स, पसंदीदा सूची, खोज और अपने YouTube स्टेशन जोड़ने की सुविधा।",
      "बारिश, जंगल, समुद्र तट, कैफ़े, अंगीठी और बिल्ली की घुरघुराहट सहित बारह ध्वनियाँ, जिनकी आवाज़ अलग-अलग तय की जा सकती है।",
      "25 या 50 मिनट का पोमोडोरो टाइमर, विराम और समायोज्य अलार्म।",
      "हल्का केवल-ऑडियो रेडियो मोड और अनुकूलनीय पृष्ठभूमि: ध्रुवीय आभा, बहता ग्रेडिएंट, पिक्सेल या अंगीठी की आग।",
    ],
    howTitle: "lofeur का उपयोग कैसे करें?",
    how: "रेडियो शुरू करें, आवाज़ तय करें और चाहें तो परिवेश ध्वनि जोड़ें। समयबद्ध सत्रों के लिए पोमोडोरो चलाएँ। कैमरा बटन से YouTube वीडियो चालू होता है; डेटा बचाने के लिए इसे बंद करके केवल ऑडियो मोड में लौटें।",
    faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
    faq: [
      [
        "क्या खाता बनाना ज़रूरी है?",
        "नहीं। स्टेशन, पसंदीदा, रंग और सेटिंग आपके ब्राउज़र में रहते हैं। बैकअप या दूसरे उपकरण पर ले जाने के लिए स्टेशन निर्यात करें।",
      ],
      [
        "क्या बिना वीडियो सुन सकते हैं?",
        "हाँ। वीडियो बंद होने पर रेडियो सार्वजनिक ऑडियो स्ट्रीम से चलता है। YouTube मिक्स के लिए वीडियो प्लेयर आवश्यक है, जब तक आप अलग सीधा ऑडियो स्ट्रीम न दें।",
      ],
      [
        "स्टेशन धूसर क्यों दिखता है?",
        "उसका स्रोत सत्यापित सूची में अनुपलब्ध है या चलाते समय त्रुटि हुई है। उपलब्ध लाइव स्टेशन पहले, रिकॉर्डिंग उसके बाद और अनुपलब्ध स्रोत सबसे नीचे दिखाई देते हैं।",
      ],
    ],
    credits:
      "lofeur एक स्वतंत्र परियोजना है और Lofi Girl से संबद्ध नहीं है। संगीत और चित्र उनके रचनाकारों के हैं। स्ट्रीम और वीडियो के लिए इंटरनेट आवश्यक है।",
    languages: "उपलब्ध भाषाएँ",
    close: "गाइड बंद करें",
    guide: "परिचय और उपयोग गाइड",
  },
};
