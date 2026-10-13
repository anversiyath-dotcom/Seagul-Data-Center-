export interface NationalityItem {
  code: string; // 3-letter ICAO / ISO code
  country: string; // Country name
  nationality: string; // Demonym / Nationality (Uppercase)
  flag: string; // Emoji flag
  aliases?: string[];
}

export const ALL_NATIONALITIES: NationalityItem[] = [
  // --- Popular / GCC & South Asian Visas ---
  { code: 'LKA', country: 'Sri Lanka', nationality: 'SRI LANKAN', flag: '🇱🇰', aliases: ['Sri Lanka', 'Sri Lankan', 'Ceylon', 'LK'] },
  { code: 'IND', country: 'India', nationality: 'INDIAN', flag: '🇮🇳', aliases: ['India', 'Indian', 'Bharat', 'IN'] },
  { code: 'PAK', country: 'Pakistan', nationality: 'PAKISTANI', flag: '🇵🇰', aliases: ['Pakistan', 'Pakistani', 'PK'] },
  { code: 'BGD', country: 'Bangladesh', nationality: 'BANGLADESHI', flag: '🇧🇩', aliases: ['Bangladesh', 'Bangladeshi', 'BD'] },
  { code: 'PHL', country: 'Philippines', nationality: 'FILIPINO', flag: '🇵🇭', aliases: ['Philippines', 'Filipino', 'Pinoy', 'PH'] },
  { code: 'NPL', country: 'Nepal', nationality: 'NEPALESE', flag: '🇳🇵', aliases: ['Nepal', 'Nepalese', 'NP'] },
  { code: 'ARE', country: 'United Arab Emirates', nationality: 'EMIRATI', flag: '🇦🇪', aliases: ['UAE', 'Emirates', 'Dubai', 'Abu Dhabi', 'United Arab Emirates', 'AE'] },
  { code: 'SAU', country: 'Saudi Arabia', nationality: 'SAUDI', flag: '🇸🇦', aliases: ['KSA', 'Saudi Arabia', 'Saudi', 'SA'] },
  { code: 'OMN', country: 'Oman', nationality: 'OMANI', flag: '🇴🇲', aliases: ['Oman', 'Omani', 'OM'] },
  { code: 'QAT', country: 'Qatar', nationality: 'QATARI', flag: '🇶🇦', aliases: ['Qatar', 'Qatari', 'QA'] },
  { code: 'KWT', country: 'Kuwait', nationality: 'KUWAITI', flag: '🇰🇼', aliases: ['Kuwait', 'Kuwaiti', 'KW'] },
  { code: 'BHR', country: 'Bahrain', nationality: 'BAHRAINI', flag: '🇧🇭', aliases: ['Bahrain', 'Bahraini', 'BH'] },
  { code: 'EGY', country: 'Egypt', nationality: 'EGYPTIAN', flag: '🇪🇬', aliases: ['Egypt', 'Egyptian', 'EG'] },
  { code: 'JOR', country: 'Jordan', nationality: 'JORDANIAN', flag: '🇯🇴', aliases: ['Jordan', 'Jordanian', 'JO'] },
  { code: 'LBN', country: 'Lebanon', nationality: 'LEBANESE', flag: '🇱🇧', aliases: ['Lebanon', 'Lebanese', 'LB'] },
  { code: 'SYR', country: 'Syria', nationality: 'SYRIAN', flag: '🇸🇾', aliases: ['Syria', 'Syrian', 'SY'] },
  { code: 'IRQ', country: 'Iraq', nationality: 'IRAQI', flag: '🇮🇶', aliases: ['Iraq', 'Iraqi', 'IQ'] },
  { code: 'YEM', country: 'Yemen', nationality: 'YEMENI', flag: '🇾🇪', aliases: ['Yemen', 'Yemeni', 'YE'] },
  { code: 'IRN', country: 'Iran', nationality: 'IRANIAN', flag: '🇮🇷', aliases: ['Iran', 'Iranian', 'Persian', 'IR'] },
  { code: 'IDN', country: 'Indonesia', nationality: 'INDONESIAN', flag: '🇮🇩', aliases: ['Indonesia', 'Indonesian', 'ID'] },
  { code: 'MYS', country: 'Malaysia', nationality: 'MALAYSIAN', flag: '🇲🇾', aliases: ['Malaysia', 'Malaysian', 'MY'] },
  { code: 'SGP', country: 'Singapore', nationality: 'SINGAPOREAN', flag: '🇸🇬', aliases: ['Singapore', 'Singaporean', 'SG'] },
  { code: 'THA', country: 'Thailand', nationality: 'THAI', flag: '🇹🇭', aliases: ['Thailand', 'Thai', 'Siam', 'TH'] },
  { code: 'VNM', country: 'Vietnam', nationality: 'VIETNAMESE', flag: '🇻🇳', aliases: ['Vietnam', 'Vietnamese', 'VN'] },
  { code: 'MMR', country: 'Myanmar', nationality: 'BURMESE', flag: '🇲🇲', aliases: ['Myanmar', 'Burma', 'Burmese', 'MM'] },
  { code: 'ETH', country: 'Ethiopia', nationality: 'ETHIOPIAN', flag: '🇪🇹', aliases: ['Ethiopia', 'Ethiopian', 'ET'] },
  { code: 'KEN', country: 'Kenya', nationality: 'KENYAN', flag: '🇰🇪', aliases: ['Kenya', 'Kenyan', 'KE'] },
  { code: 'UGA', country: 'Uganda', nationality: 'UGANDAN', flag: '🇺🇬', aliases: ['Uganda', 'Ugandan', 'UG'] },
  { code: 'NGA', country: 'Nigeria', nationality: 'NIGERIAN', flag: '🇳🇬', aliases: ['Nigeria', 'Nigerian', 'NG'] },
  { code: 'GHA', country: 'Ghana', nationality: 'GHANAIAN', flag: '🇬🇭', aliases: ['Ghana', 'Ghanaian', 'GH'] },
  { code: 'SDN', country: 'Sudan', nationality: 'SUDANESE', flag: '🇸🇩', aliases: ['Sudan', 'Sudanese', 'SD'] },
  { code: 'GBR', country: 'United Kingdom', nationality: 'BRITISH', flag: '🇬🇧', aliases: ['UK', 'Britain', 'England', 'Scotland', 'Wales', 'British', 'United Kingdom', 'GB'] },
  { code: 'USA', country: 'United States', nationality: 'AMERICAN', flag: '🇺🇸', aliases: ['USA', 'US', 'America', 'American', 'United States', 'United States of America'] },
  { code: 'CAN', country: 'Canada', nationality: 'CANADIAN', flag: '🇨🇦', aliases: ['Canada', 'Canadian', 'CA'] },
  { code: 'AUS', country: 'Australia', nationality: 'AUSTRALIAN', flag: '🇦🇺', aliases: ['Australia', 'Australian', 'Aussie', 'AU'] },
  { code: 'TUR', country: 'Turkey', nationality: 'TURKISH', flag: '🇹🇷', aliases: ['Turkey', 'Turkiye', 'Turkish', 'TR'] },
  { code: 'RUS', country: 'Russia', nationality: 'RUSSIAN', flag: '🇷🇺', aliases: ['Russia', 'Russian', 'RU'] },
  { code: 'CHN', country: 'China', nationality: 'CHINESE', flag: '🇨🇳', aliases: ['China', 'Chinese', 'CN'] },

  // --- Complete A-Z All World Nationalities ---
  { code: 'AFG', country: 'Afghanistan', nationality: 'AFGHAN', flag: '🇦🇫' },
  { code: 'ALB', country: 'Albania', nationality: 'ALBANIAN', flag: '🇦🇱' },
  { code: 'DZA', country: 'Algeria', nationality: 'ALGERIAN', flag: '🇩🇿' },
  { code: 'AND', country: 'Andorra', nationality: 'ANDORRAN', flag: '🇦🇩' },
  { code: 'AGO', country: 'Angola', nationality: 'ANGOLAN', flag: '🇦🇴' },
  { code: 'ATG', country: 'Antigua and Barbuda', nationality: 'ANTIGUAN', flag: '🇦🇬' },
  { code: 'ARG', country: 'Argentina', nationality: 'ARGENTINE', flag: '🇦🇷' },
  { code: 'ARM', country: 'Armenia', nationality: 'ARMENIAN', flag: '🇦🇲' },
  { code: 'AUT', country: 'Austria', nationality: 'AUSTRIAN', flag: '🇦🇹' },
  { code: 'AZE', country: 'Azerbaijan', nationality: 'AZERBAIJANI', flag: '🇦🇿' },
  { code: 'BHS', country: 'Bahamas', nationality: 'BAHAMIAN', flag: '🇧🇸' },
  { code: 'BRB', country: 'Barbados', nationality: 'BARBADIAN', flag: '🇧🇧' },
  { code: 'BLR', country: 'Belarus', nationality: 'BELARUSIAN', flag: '🇧🇾' },
  { code: 'BEL', country: 'Belgium', nationality: 'BELGIAN', flag: '🇧🇪' },
  { code: 'BLZ', country: 'Belize', nationality: 'BELIZEAN', flag: '🇧🇿' },
  { code: 'BEN', country: 'Benin', nationality: 'BENINESE', flag: '🇧🇯' },
  { code: 'BTN', country: 'Bhutan', nationality: 'BHUTANESE', flag: '🇧🇹' },
  { code: 'BOL', country: 'Bolivia', nationality: 'BOLIVIAN', flag: '🇧🇴' },
  { code: 'BIH', country: 'Bosnia and Herzegovina', nationality: 'BOSNIAN', flag: '🇧🇦' },
  { code: 'BWA', country: 'Botswana', nationality: 'BOTSWANAN', flag: '🇧🇼' },
  { code: 'BRA', country: 'Brazil', nationality: 'BRAZILIAN', flag: '🇧🇷' },
  { code: 'BRN', country: 'Brunei', nationality: 'BRUNEIAN', flag: '🇧🇳' },
  { code: 'BGR', country: 'Bulgaria', nationality: 'BULGARIAN', flag: '🇧🇬' },
  { code: 'BFA', country: 'Burkina Faso', nationality: 'BURKINABE', flag: '🇧🇫' },
  { code: 'BDI', country: 'Burundi', nationality: 'BURUNDIAN', flag: '🇧🇮' },
  { code: 'CPV', country: 'Cabo Verde', nationality: 'CABO VERDEAN', flag: '🇨🇻' },
  { code: 'KHM', country: 'Cambodia', nationality: 'CAMBODIAN', flag: '🇰🇭' },
  { code: 'CMR', country: 'Cameroon', nationality: 'CAMEROONIAN', flag: '🇨🇲' },
  { code: 'CAF', country: 'Central African Republic', nationality: 'CENTRAL AFRICAN', flag: '🇨🇫' },
  { code: 'TCD', country: 'Chad', nationality: 'CHADIAN', flag: '🇹🇩' },
  { code: 'CHL', country: 'Chile', nationality: 'CHILEAN', flag: '🇨🇱' },
  { code: 'COL', country: 'Colombia', nationality: 'COLOMBIAN', flag: '🇨🇴' },
  { code: 'COM', country: 'Comoros', nationality: 'COMORIAN', flag: '🇰🇲' },
  { code: 'COG', country: 'Congo (Republic)', nationality: 'CONGOLESE', flag: '🇨🇬' },
  { code: 'COD', country: 'Congo (DRC)', nationality: 'CONGOLESE (DRC)', flag: '🇨🇩' },
  { code: 'CRI', country: 'Costa Rica', nationality: 'COSTA RICAN', flag: '🇨🇷' },
  { code: 'CIV', country: "Cote d'Ivoire", nationality: 'IVORIAN', flag: '🇨🇮' },
  { code: 'HRV', country: 'Croatia', nationality: 'CROATIAN', flag: '🇭🇷' },
  { code: 'CUB', country: 'Cuba', nationality: 'CUBAN', flag: '🇨🇺' },
  { code: 'CYP', country: 'Cyprus', nationality: 'CYPRIOT', flag: '🇨🇾' },
  { code: 'CZE', country: 'Czech Republic', nationality: 'CZECH', flag: '🇨🇿' },
  { code: 'DNK', country: 'Denmark', nationality: 'DANISH', flag: '🇩🇰' },
  { code: 'DJI', country: 'Djibouti', nationality: 'DJIBOUTIAN', flag: '🇩🇯' },
  { code: 'DMA', country: 'Dominica', nationality: 'DOMINICAN (DOMINICA)', flag: '🇩🇲' },
  { code: 'DOM', country: 'Dominican Republic', nationality: 'DOMINICAN', flag: '🇩🇴' },
  { code: 'ECU', country: 'Ecuador', nationality: 'ECUADORIAN', flag: '🇪🇨' },
  { code: 'SLV', country: 'El Salvador', nationality: 'SALVADORAN', flag: '🇸🇻' },
  { code: 'GNQ', country: 'Equatorial Guinea', nationality: 'EQUATORIAL GUINEAN', flag: '🇬🇶' },
  { code: 'ERI', country: 'Eritrea', nationality: 'ERITREAN', flag: '🇪🇷' },
  { code: 'EST', country: 'Estonia', nationality: 'ESTONIAN', flag: '🇪🇪' },
  { code: 'SWZ', country: 'Eswatini', nationality: 'SWASI', flag: '🇸🇿' },
  { code: 'FJI', country: 'Fiji', nationality: 'FIJIAN', flag: '🇫🇯' },
  { code: 'FIN', country: 'Finland', nationality: 'FINNISH', flag: '🇫🇮' },
  { code: 'FRA', country: 'France', nationality: 'FRENCH', flag: '🇫🇷' },
  { code: 'GAB', country: 'Gabon', nationality: 'GABONESE', flag: '🇬🇦' },
  { code: 'GMB', country: 'Gambia', nationality: 'GAMBIAN', flag: '🇬🇲' },
  { code: 'GEO', country: 'Georgia', nationality: 'GEORGIAN', flag: '🇬🇪' },
  { code: 'DEU', country: 'Germany', nationality: 'GERMAN', flag: '🇩🇪' },
  { code: 'GRC', country: 'Greece', nationality: 'GREEK', flag: '🇬🇷' },
  { code: 'GRD', country: 'Grenada', nationality: 'GRENADIAN', flag: '🇬🇩' },
  { code: 'GTM', country: 'Guatemala', nationality: 'GUATEMALAN', flag: '🇬🇹' },
  { code: 'GIN', country: 'Guinea', nationality: 'GUINEAN', flag: '🇬🇳' },
  { code: 'GNB', country: 'Guinea-Bissau', nationality: 'GUINEA-BISSAUAN', flag: '🇬🇼' },
  { code: 'GUY', country: 'Guyana', nationality: 'GUYANESE', flag: '🇬🇾' },
  { code: 'HTI', country: 'Haiti', nationality: 'HAITIAN', flag: '🇭🇹' },
  { code: 'HND', country: 'Honduras', nationality: 'HONDURAN', flag: '🇭🇳' },
  { code: 'HKG', country: 'Hong Kong', nationality: 'HONG KONG', flag: '🇭🇰' },
  { code: 'HUN', country: 'Hungary', nationality: 'HUNGARIAN', flag: '🇭🇺' },
  { code: 'ISL', country: 'Iceland', nationality: 'ICELANDIC', flag: '🇮🇸' },
  { code: 'IRL', country: 'Ireland', nationality: 'IRISH', flag: '🇮🇪' },
  { code: 'ISR', country: 'Israel', nationality: 'ISRAELI', flag: '🇮🇱' },
  { code: 'ITA', country: 'Italy', nationality: 'ITALIAN', flag: '🇮🇹' },
  { code: 'JAM', country: 'Jamaica', nationality: 'JAMAICAN', flag: '🇯🇲' },
  { code: 'JPN', country: 'Japan', nationality: 'JAPANESE', flag: '🇯🇵' },
  { code: 'KAZ', country: 'Kazakhstan', nationality: 'KAZAKHSTANI', flag: '🇰🇿' },
  { code: 'KIR', country: 'Kiribati', nationality: 'I-KIRIBATI', flag: '🇰🇮' },
  { code: 'PRK', country: 'North Korea', nationality: 'NORTH KOREAN', flag: '🇰🇵' },
  { code: 'KOR', country: 'South Korea', nationality: 'SOUTH KOREAN', flag: '🇰🇷' },
  { code: 'KGZ', country: 'Kyrgyzstan', nationality: 'KYRGYZ', flag: '🇰🇬' },
  { code: 'LAO', country: 'Laos', nationality: 'LAOTIAN', flag: '🇱🇦' },
  { code: 'LVA', country: 'Latvia', nationality: 'LATVIAN', flag: '🇱🇻' },
  { code: 'LSO', country: 'Lesotho', nationality: 'BASOTHO', flag: '🇱🇸' },
  { code: 'LBR', country: 'Liberia', nationality: 'LIBERIAN', flag: '🇱🇷' },
  { code: 'LBY', country: 'Libya', nationality: 'LIBYAN', flag: '🇱🇾' },
  { code: 'LIE', country: 'Liechtenstein', nationality: 'LIECHTENSTEINER', flag: '🇱🇮' },
  { code: 'LTU', country: 'Lithuania', nationality: 'LITHUANIAN', flag: '🇱🇹' },
  { code: 'LUX', country: 'Luxembourg', nationality: 'LUXEMBOURGER', flag: '🇱🇺' },
  { code: 'MDG', country: 'Madagascar', nationality: 'MALAGASY', flag: '🇲🇬' },
  { code: 'MWI', country: 'Malawi', nationality: 'MALAWIAN', flag: '🇲🇼' },
  { code: 'MDV', country: 'Maldives', nationality: 'MALDIVIAN', flag: '🇲🇻' },
  { code: 'MLI', country: 'Mali', nationality: 'MALIAN', flag: '🇲🇱' },
  { code: 'MLT', country: 'Malta', nationality: 'MALTESE', flag: '🇲🇹' },
  { code: 'MHL', country: 'Marshall Islands', nationality: 'MARSHALLESE', flag: '🇲🇭' },
  { code: 'MRT', country: 'Mauritania', nationality: 'MAURITANIAN', flag: '🇲🇷' },
  { code: 'MUS', country: 'Mauritius', nationality: 'MAURITIAN', flag: '🇲🇺' },
  { code: 'MEX', country: 'Mexico', nationality: 'MEXICAN', flag: '🇲🇽' },
  { code: 'FSM', country: 'Micronesia', nationality: 'MICRONESIAN', flag: '🇫🇲' },
  { code: 'MDA', country: 'Moldova', nationality: 'MOLDOVAN', flag: '🇲🇩' },
  { code: 'MCO', country: 'Monaco', nationality: 'MONEGASQUE', flag: '🇲🇨' },
  { code: 'MNG', country: 'Mongolia', nationality: 'MONGOLIAN', flag: '🇲🇳' },
  { code: 'MNE', country: 'Montenegro', nationality: 'MONTENEGRIN', flag: '🇲🇪' },
  { code: 'MAR', country: 'Morocco', nationality: 'MOROCCAN', flag: '🇲🇦' },
  { code: 'MOZ', country: 'Mozambique', nationality: 'MOZAMBICAN', flag: '🇲🇿' },
  { code: 'NAM', country: 'Namibia', nationality: 'NAMIBIAN', flag: '🇳🇦' },
  { code: 'NRU', country: 'Nauru', nationality: 'NAURUAN', flag: '🇳🇷' },
  { code: 'NLD', country: 'Netherlands', nationality: 'DUTCH', flag: '🇳🇱' },
  { code: 'NZL', country: 'New Zealand', nationality: 'NEW ZEALANDER', flag: '🇳🇿' },
  { code: 'NIC', country: 'Nicaragua', nationality: 'NICARAGUAN', flag: '🇳🇮' },
  { code: 'NER', country: 'Niger', nationality: 'NIGERIEN', flag: '🇳🇪' },
  { code: 'MKD', country: 'North Macedonia', nationality: 'MACEDONIAN', flag: '🇲🇰' },
  { code: 'NOR', country: 'Norway', nationality: 'NORWEGIAN', flag: '🇳🇴' },
  { code: 'PLW', country: 'Palau', nationality: 'PALAUAN', flag: '🇵🇼' },
  { code: 'PSE', country: 'Palestine', nationality: 'PALESTINIAN', flag: '🇵🇸' },
  { code: 'PAN', country: 'Panama', nationality: 'PANAMANIAN', flag: '🇵🇦' },
  { code: 'PNG', country: 'Papua New Guinea', nationality: 'PAPUA NEW GUINEAN', flag: '🇵🇬' },
  { code: 'PRY', country: 'Paraguay', nationality: 'PARAGUAYAN', flag: '🇵🇾' },
  { code: 'PER', country: 'Peru', nationality: 'PERUVIAN', flag: '🇵🇪' },
  { code: 'POL', country: 'Poland', nationality: 'POLISH', flag: '🇵🇱' },
  { code: 'PRT', country: 'Portugal', nationality: 'PORTUGUESE', flag: '🇵🇹' },
  { code: 'ROU', country: 'Romania', nationality: 'ROMANIAN', flag: '🇷🇴' },
  { code: 'RWA', country: 'Rwanda', nationality: 'RWANDAN', flag: '🇷🇼' },
  { code: 'KNA', country: 'Saint Kitts and Nevis', nationality: 'KITTIAN', flag: '🇰🇳' },
  { code: 'LCA', country: 'Saint Lucia', nationality: 'SAINT LUCIAN', flag: '🇱🇨' },
  { code: 'VCT', country: 'Saint Vincent and the Grenadines', nationality: 'VINCENTIAN', flag: '🇻🇨' },
  { code: 'WSM', country: 'Samoa', nationality: 'SAMOAN', flag: '🇼🇸' },
  { code: 'SMR', country: 'San Marino', nationality: 'SAMMARINESE', flag: '🇸🇲' },
  { code: 'STP', country: 'Sao Tome and Principe', nationality: 'SANTOMEAN', flag: '🇸🇹' },
  { code: 'SEN', country: 'Senegal', nationality: 'SENEGALESE', flag: '🇸🇳' },
  { code: 'SRB', country: 'Serbia', nationality: 'SERBIAN', flag: '🇷🇸' },
  { code: 'SYC', country: 'Seychelles', nationality: 'SEYCHELLOIS', flag: '🇸🇨' },
  { code: 'SLE', country: 'Sierra Leone', nationality: 'SIERRA LEONEAN', flag: '🇸🇱' },
  { code: 'SVK', country: 'Slovakia', nationality: 'SLOVAK', flag: '🇸🇰' },
  { code: 'SVN', country: 'Slovenia', nationality: 'SLOVENIAN', flag: '🇸🇮' },
  { code: 'SLB', country: 'Solomon Islands', nationality: 'SOLOMON ISLANDER', flag: '🇸🇧' },
  { code: 'SOM', country: 'Somalia', nationality: 'SOMALI', flag: '🇸🇴' },
  { code: 'ZAF', country: 'South Africa', nationality: 'SOUTH AFRICAN', flag: '🇿🇦' },
  { code: 'SSD', country: 'South Sudan', nationality: 'SOUTH SUDANESE', flag: '🇸🇸' },
  { code: 'ESP', country: 'Spain', nationality: 'SPANISH', flag: '🇪🇸' },
  { code: 'SUR', country: 'Suriname', nationality: 'SURINAMESE', flag: '🇸🇷' },
  { code: 'SWE', country: 'Sweden', nationality: 'SWEDISH', flag: '🇸🇪' },
  { code: 'CHE', country: 'Switzerland', nationality: 'SWISS', flag: '🇨🇭' },
  { code: 'TWN', country: 'Taiwan', nationality: 'TAIWANESE', flag: '🇹🇼' },
  { code: 'TJK', country: 'Tajikistan', nationality: 'TAJIK', flag: '🇹🇯' },
  { code: 'TZA', country: 'Tanzania', nationality: 'TANZANIAN', flag: '🇹🇿' },
  { code: 'TLS', country: 'Timor-Leste', nationality: 'TIMORESE', flag: '🇹🇱' },
  { code: 'TGO', country: 'Togo', nationality: 'TOGOLESE', flag: '🇹🇬' },
  { code: 'TON', country: 'Tonga', nationality: 'TONGAN', flag: '🇹🇴' },
  { code: 'TTO', country: 'Trinidad and Tobago', nationality: 'TRINIDADIAN', flag: '🇹🇹' },
  { code: 'TUN', country: 'Tunisia', nationality: 'TUNISIAN', flag: '🇹🇳' },
  { code: 'TKM', country: 'Turkmenistan', nationality: 'TURKMEN', flag: '🇹🇲' },
  { code: 'TUV', country: 'Tuvalu', nationality: 'TUVALUAN', flag: '🇹🇻' },
  { code: 'UKR', country: 'Ukraine', nationality: 'UKRAINIAN', flag: '🇺🇦' },
  { code: 'URY', country: 'Uruguay', nationality: 'URUGUAYAN', flag: '🇺🇾' },
  { code: 'UZB', country: 'Uzbekistan', nationality: 'UZBEK', flag: '🇺🇿' },
  { code: 'VUT', country: 'Vanuatu', nationality: 'NI-VANUATU', flag: '🇻🇺' },
  { code: 'VAT', country: 'Vatican City', nationality: 'VATICAN', flag: '🇻🇦' },
  { code: 'VEN', country: 'Venezuela', nationality: 'VENEZUELAN', flag: '🇻🇪' },
  { code: 'ZMB', country: 'Zambia', nationality: 'ZAMBIAN', flag: '🇿🇲' },
  { code: 'ZWE', country: 'Zimbabwe', nationality: 'ZIMBABWEAN', flag: '🇿🇼' },
];

// Unique sorted list of all nationalities for dropdowns / select lists
// Sorted alphabetically with popular at the top
export const POPULAR_NATIONALITIES = [
  'SRI LANKAN',
  'INDIAN',
  'PAKISTANI',
  'BANGLADESHI',
  'FILIPINO',
  'NEPALESE',
  'EMIRATI',
  'SAUDI',
  'OMANI',
  'QATARI',
  'KUWAITI',
  'BAHRAINI',
  'EGYPTIAN',
  'JORDANIAN',
  'LEBANESE',
  'SYRIAN',
  'INDONESIAN',
  'MALAYSIAN',
  'ETHIOPIAN',
  'KENYAN',
  'UGANDAN',
  'NIGERIAN',
  'SUDANESE',
  'BRITISH',
  'AMERICAN',
  'CANADIAN',
  'AUSTRALIAN',
  'RUSSIAN',
  'CHINESE',
  'TURKISH',
];

// Deduplicated list of all unique nationality values
export const ALL_NATIONALITY_OPTIONS: { value: string; label: string; flag: string }[] = (() => {
  const seen = new Set<string>();
  const list: { value: string; label: string; flag: string }[] = [];

  for (const item of ALL_NATIONALITIES) {
    if (!seen.has(item.nationality)) {
      seen.add(item.nationality);
      list.push({
        value: item.nationality,
        label: `${item.flag} ${item.nationality} (${item.country})`,
        flag: item.flag,
      });
    }
  }

  return list;
})();

/**
 * Helper to get flag emoji for a given nationality string
 */
export function getNationalityFlag(nationality?: string): string {
  if (!nationality) return '🌐';
  const clean = nationality.trim().toUpperCase();
  const match = ALL_NATIONALITIES.find(
    (n) => n.nationality === clean || n.code === clean || n.country.toUpperCase() === clean
  );
  return match ? match.flag : '🌐';
}

/**
 * Normalizes input nationality into standard uppercase demonym if recognized
 */
export function normalizeNationality(input?: string): string {
  if (!input) return 'SRI LANKAN';
  const clean = input.trim().toUpperCase();
  const match = ALL_NATIONALITIES.find(
    (n) =>
      n.nationality === clean ||
      n.code === clean ||
      n.country.toUpperCase() === clean ||
      clean.includes(n.nationality) ||
      clean.includes(n.country.toUpperCase())
  );
  return match ? match.nationality : clean;
}

/**
 * Returns associated country name for a given nationality/code
 */
export function getNationalityCountry(nationality?: string): string {
  if (!nationality) return '';
  const clean = nationality.trim().toUpperCase();
  const match = ALL_NATIONALITIES.find(
    (n) => n.nationality === clean || n.code === clean || n.country.toUpperCase() === clean
  );
  return match ? match.country : '';
}

/**
 * High-precision search for nationalities and countries
 * Handles demonyms, country names, 3-letter codes, and aliases.
 * When user types "sri", "Sri Lanka" and "SRI LANKAN" rank right at the top.
 */
export function searchNationalities(query: string): NationalityItem[] {
  if (!query || !query.trim()) return ALL_NATIONALITIES;
  const q = query.trim().toLowerCase();

  return ALL_NATIONALITIES.map((item) => {
    const nat = item.nationality.toLowerCase();
    const country = item.country.toLowerCase();
    const code = item.code.toLowerCase();
    const aliases = (item.aliases || []).map((a) => a.toLowerCase());

    let score = 0;
    // Exact match
    if (country === q || nat === q || code === q || aliases.some((a) => a === q)) {
      score = 100;
    }
    // Country or Nationality starts with query (e.g. "sri" -> "Sri Lanka", "Sri Lankan")
    else if (country.startsWith(q) || nat.startsWith(q)) {
      score = 80;
    }
    // Code or alias starts with query (e.g. "lka", "uae", "uk")
    else if (code.startsWith(q) || aliases.some((a) => a.startsWith(q))) {
      score = 75;
    }
    // Sub-words in country or nationality start with query (e.g. "lanka" in "Sri Lanka", "arab" in "United Arab Emirates")
    else if (
      country.split(/[\s-]+/).some((w) => w.startsWith(q)) ||
      nat.split(/[\s-]+/).some((w) => w.startsWith(q))
    ) {
      score = 70;
    }
    // Substring contains
    else if (country.includes(q) || nat.includes(q)) {
      score = 50;
    } else if (aliases.some((a) => a.includes(q))) {
      score = 40;
    }

    return { item, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);
}
