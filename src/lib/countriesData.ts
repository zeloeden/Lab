// Comprehensive countries and cities data for supplier management

export interface Country {
  code: string;
  name: string;
  cities: string[];
}

export const countriesData: Country[] = [
  // Middle East & Gulf
  {
    code: 'AE',
    name: 'United Arab Emirates',
    cities: [
      'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Fujairah', 'Ras Al Khaimah', 'Umm Al Quwain',
      'Al Ain', 'Khor Fakkan', 'Kalba', 'Dibba', 'Madinat Zayed', 'Liwa', 'Ghayathi'
    ]
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    cities: [
      'Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Dhahran', 'Taif', 'Buraidah',
      'Tabuk', 'Hail', 'Khamis Mushait', 'Najran', 'Jazan', 'Yanbu', 'Al Jubail', 'Abha', 'Arar'
    ]
  },
  {
    code: 'QA',
    name: 'Qatar',
    cities: [
      'Doha', 'Al Rayyan', 'Umm Salal', 'Al Khor', 'Al Wakrah', 'Madinat ash Shamal', 'Al Daayen'
    ]
  },
  {
    code: 'KW',
    name: 'Kuwait',
    cities: [
      'Kuwait City', 'Hawalli', 'As Salimiyah', 'Sabah as Salim', 'Al Farwaniyah', 'Al Ahmadi', 'Ar Rumaythiyah'
    ]
  },
  {
    code: 'BH',
    name: 'Bahrain',
    cities: [
      'Manama', 'Riffa', 'Muharraq', 'Hamad Town', 'A\'ali', 'Isa Town', 'Sitra', 'Budaiya'
    ]
  },
  {
    code: 'OM',
    name: 'Oman',
    cities: [
      'Muscat', 'Salalah', 'Sohar', 'Nizwa', 'Sur', 'Rustaq', 'Buraimi', 'Ibri', 'Samail'
    ]
  },
  {
    code: 'JO',
    name: 'Jordan',
    cities: [
      'Amman', 'Zarqa', 'Irbid', 'Russeifa', 'Wadi as Sir', 'Aqaba', 'Madaba', 'As Salt', 'Mafraq'
    ]
  },
  {
    code: 'LB',
    name: 'Lebanon',
    cities: [
      'Beirut', 'Tripoli', 'Sidon', 'Tyre', 'Nabatieh', 'Jounieh', 'Zahle', 'Baalbek', 'Byblos'
    ]
  },
  {
    code: 'SY',
    name: 'Syria',
    cities: [
      'Damascus', 'Aleppo', 'Homs', 'Hamah', 'Latakia', 'Deir ez-Zor', 'Raqqa', 'Daraa', 'As-Suwayda'
    ]
  },
  {
    code: 'IQ',
    name: 'Iraq',
    cities: [
      'Baghdad', 'Basra', 'Mosul', 'Erbil', 'Kirkuk', 'Najaf', 'Karbala', 'Sulaymaniyah', 'Nasiriyah'
    ]
  },
  {
    code: 'IR',
    name: 'Iran',
    cities: [
      'Tehran', 'Mashhad', 'Isfahan', 'Karaj', 'Shiraz', 'Tabriz', 'Qom', 'Ahvaz', 'Kermanshah'
    ]
  },
  
  {
    code: 'PS',
    name: 'Palestine',
    cities: [
      'Gaza', 'Ramallah', 'Hebron', 'Nablus', 'Bethlehem', 'Khan Yunis', 'Rafah', 'Jenin', 'Tulkarm'
    ]
  },
  {
    code: 'YE',
    name: 'Yemen',
    cities: [
      'Sanaa', 'Aden', 'Taiz', 'Hodeidah', 'Mukalla', 'Ibb', 'Dhamar', 'Amran', 'Saada'
    ]
  },

  // North Africa
  {
    code: 'EG',
    name: 'Egypt',
    cities: [
      'Cairo', 'Alexandria', 'Giza', 'Shubra El-Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'Tanta',
      'Asyut', 'Ismailia', 'Fayyum', 'Zagazig', 'Aswan', 'Damietta', 'Minya', 'Damanhur', 'Beni Suef'
    ]
  },
  {
    code: 'MA',
    name: 'Morocco',
    cities: [
      'Casablanca', 'Rabat', 'Fes', 'Marrakech', 'Agadir', 'Tangier', 'Meknes', 'Oujda', 'Kenitra',
      'Tetouan', 'Temara', 'Safi', 'Mohammedia', 'Khouribga', 'El Jadida', 'Beni Mellal', 'Nador'
    ]
  },
  {
    code: 'TN',
    name: 'Tunisia',
    cities: [
      'Tunis', 'Sfax', 'Sousse', 'Ettadhamen', 'Kairouan', 'Bizerte', 'Gabes', 'Ariana', 'Gafsa',
      'Monastir', 'Ben Arous', 'Kasserine', 'Medenine', 'Nabeul', 'Beja', 'Jendouba'
    ]
  },
  {
    code: 'DZ',
    name: 'Algeria',
    cities: [
      'Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa', 'Setif', 'Sidi Bel Abbes',
      'Biskra', 'Tebessa', 'El Oued', 'Skikda', 'Tiaret', 'Bejaia', 'Tlemcen', 'Ouargla'
    ]
  },
  {
    code: 'LY',
    name: 'Libya',
    cities: [
      'Tripoli', 'Benghazi', 'Misrata', 'Tarhuna', 'Al Bayda', 'Zawiya', 'Zliten', 'Ajdabiya', 'Tobruk'
    ]
  },
  {
    code: 'SD',
    name: 'Sudan',
    cities: [
      'Khartoum', 'Omdurman', 'Port Sudan', 'Kassala', 'Obeid', 'Nyala', 'Gedaref', 'Wad Medani'
    ]
  },

  // Sub-Saharan Africa
  {
    code: 'NG',
    name: 'Nigeria',
    cities: [
      'Lagos', 'Kano', 'Ibadan', 'Abuja', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba',
      'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Kaduna', 'Abeokuta', 'Ogbomoso', 'Sokoto', 'Osogbo'
    ]
  },
  {
    code: 'ZA',
    name: 'South Africa',
    cities: [
      'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Pietermaritzburg', 'Nelspruit'
    ]
  },
  {
    code: 'KE',
    name: 'Kenya',
    cities: [
      'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale', 'Garissa'
    ]
  },
  {
    code: 'ET',
    name: 'Ethiopia',
    cities: [
      'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Adama', 'Awasa', 'Bahir Dar', 'Gondar', 'Dessie', 'Jimma'
    ]
  },
  {
    code: 'GH',
    name: 'Ghana',
    cities: [
      'Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Sunyani', 'Cape Coast', 'Obuasi', 'Teshi'
    ]
  },

  // Europe
  {
    code: 'GB',
    name: 'United Kingdom',
    cities: [
      'London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol',
      'Cardiff', 'Leicester', 'Coventry', 'Bradford', 'Belfast', 'Nottingham', 'Plymouth', 'Stoke-on-Trent', 'Wolverhampton'
    ]
  },
  {
    code: 'FR',
    name: 'France',
    cities: [
      'Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux',
      'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers'
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    cities: [
      'Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen',
      'Leipzig', 'Bremen', 'Dresden', 'Hanover', 'Nuremberg', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld'
    ]
  },
  {
    code: 'IT',
    name: 'Italy',
    cities: [
      'Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari',
      'Catania', 'Venice', 'Verona', 'Messina', 'Padua', 'Trieste', 'Brescia', 'Taranto', 'Prato'
    ]
  },
  {
    code: 'ES',
    name: 'Spain',
    cities: [
      'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas',
      'Bilbao', 'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet', 'Vitoria', 'Granada'
    ]
  },
  {
    code: 'NL',
    name: 'Netherlands',
    cities: [
      'Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Groningen', 'Almere', 'Breda',
      'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Zaanstad', 'Amersfoort', 'Apeldoorn', 'Maastricht'
    ]
  },
  {
    code: 'BE',
    name: 'Belgium',
    cities: [
      'Brussels', 'Antwerp', 'Ghent', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Leuven', 'Mons'
    ]
  },
  {
    code: 'CH',
    name: 'Switzerland',
    cities: [
      'Zurich', 'Geneva', 'Basel', 'Lausanne', 'Bern', 'Winterthur', 'Lucerne', 'St. Gallen', 'Lugano',
      'Biel', 'Thun', 'Köniz', 'La Chaux-de-Fonds', 'Schaffhausen', 'Fribourg', 'Vernier'
    ]
  },
  {
    code: 'AT',
    name: 'Austria',
    cities: [
      'Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten'
    ]
  },
  {
    code: 'SE',
    name: 'Sweden',
    cities: [
      'Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås', 'Örebro', 'Linköping', 'Helsingborg', 'Jönköping'
    ]
  },
  {
    code: 'NO',
    name: 'Norway',
    cities: [
      'Oslo', 'Bergen', 'Stavanger', 'Trondheim', 'Drammen', 'Fredrikstad', 'Kristiansand', 'Sandnes', 'Tromsø'
    ]
  },
  {
    code: 'DK',
    name: 'Denmark',
    cities: [
      'Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg', 'Randers', 'Kolding', 'Horsens', 'Vejle'
    ]
  },
  {
    code: 'FI',
    name: 'Finland',
    cities: [
      'Helsinki', 'Espoo', 'Tampere', 'Vantaa', 'Oulu', 'Turku', 'Jyväskylä', 'Lahti', 'Kuopio'
    ]
  },
  {
    code: 'PL',
    name: 'Poland',
    cities: [
      'Warsaw', 'Kraków', 'Łódź', 'Wrocław', 'Poznań', 'Gdańsk', 'Szczecin', 'Bydgoszcz', 'Lublin'
    ]
  },
  {
    code: 'CZ',
    name: 'Czech Republic',
    cities: [
      'Prague', 'Brno', 'Ostrava', 'Plzen', 'Liberec', 'Olomouc', 'Budweis', 'Hradec Králové', 'Ústí nad Labem'
    ]
  },
  {
    code: 'HU',
    name: 'Hungary',
    cities: [
      'Budapest', 'Debrecen', 'Szeged', 'Miskolc', 'Pécs', 'Győr', 'Nyíregyháza', 'Kecskemét', 'Székesfehérvár'
    ]
  },
  {
    code: 'RO',
    name: 'Romania',
    cities: [
      'Bucharest', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Constanța', 'Craiova', 'Brașov', 'Galați', 'Ploiești'
    ]
  },
  {
    code: 'BG',
    name: 'Bulgaria',
    cities: [
      'Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse', 'Stara Zagora', 'Pleven', 'Sliven', 'Dobrich'
    ]
  },
  {
    code: 'GR',
    name: 'Greece',
    cities: [
      'Athens', 'Thessaloniki', 'Patras', 'Piraeus', 'Larissa', 'Heraklion', 'Peristeri', 'Kallithea', 'Acharnes'
    ]
  },
  {
    code: 'PT',
    name: 'Portugal',
    cities: [
      'Lisbon', 'Porto', 'Amadora', 'Braga', 'Setúbal', 'Coimbra', 'Queluz', 'Funchal', 'Cacém'
    ]
  },
  {
    code: 'IE',
    name: 'Ireland',
    cities: [
      'Dublin', 'Cork', 'Limerick', 'Galway', 'Waterford', 'Drogheda', 'Dundalk', 'Swords', 'Bray'
    ]
  },
  {
    code: 'RU',
    name: 'Russia',
    cities: [
      'Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhniy Novgorod', 'Kazan', 'Chelyabinsk', 'Omsk', 'Samara',
      'Rostov-on-Don', 'Ufa', 'Krasnoyarsk', 'Perm', 'Voronezh', 'Volgograd', 'Krasnodar', 'Saratov', 'Tyumen'
    ]
  },
  {
    code: 'UA',
    name: 'Ukraine',
    cities: [
      'Kyiv', 'Kharkiv', 'Odessa', 'Dnipro', 'Donetsk', 'Zaporizhzhia', 'Lviv', 'Kryvyi Rih', 'Mykolaiv'
    ]
  },
  {
    code: 'TR',
    name: 'Turkey',
    cities: [
      'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Adana', 'Gaziantep', 'Konya', 'Antalya', 'Kayseri',
      'Mersin', 'Eskişehir', 'Diyarbakır', 'Samsun', 'Denizli', 'Şanlıurfa', 'Adapazarı', 'Malatya'
    ]
  },

  // Americas
  {
    code: 'US',
    name: 'United States',
    cities: [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas',
      'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis', 'Seattle',
      'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis'
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    cities: [
      'Toronto', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Mississauga', 'Winnipeg', 'Vancouver', 'Brampton',
      'Hamilton', 'Quebec City', 'Surrey', 'Laval', 'Halifax', 'London', 'Markham', 'Vaughan', 'Gatineau'
    ]
  },
  {
    code: 'MX',
    name: 'Mexico',
    cities: [
      'Mexico City', 'Guadalajara', 'Monterrey', 'Puebla', 'Tijuana', 'León', 'Juárez', 'Torreón', 'Querétaro',
      'San Luis Potosí', 'Mérida', 'Mexicali', 'Aguascalientes', 'Cuernavaca', 'Saltillo', 'Hermosillo', 'Culiacán'
    ]
  },
  {
    code: 'BR',
    name: 'Brazil',
    cities: [
      'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife',
      'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias'
    ]
  },
  {
    code: 'AR',
    name: 'Argentina',
    cities: [
      'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán', 'La Plata', 'Mar del Plata', 'Salta', 'Santa Fe'
    ]
  },
  {
    code: 'CL',
    name: 'Chile',
    cities: [
      'Santiago', 'Valparaíso', 'Concepción', 'La Serena', 'Antofagasta', 'Temuco', 'Rancagua', 'Talca', 'Arica'
    ]
  },
  {
    code: 'CO',
    name: 'Colombia',
    cities: [
      'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta', 'Soledad', 'Ibagué', 'Bucaramanga'
    ]
  },
  {
    code: 'PE',
    name: 'Peru',
    cities: [
      'Lima', 'Arequipa', 'Trujillo', 'Chiclayo', 'Huancayo', 'Piura', 'Iquitos', 'Cusco', 'Chimbote'
    ]
  },
  {
    code: 'VE',
    name: 'Venezuela',
    cities: [
      'Caracas', 'Maracaibo', 'Valencia', 'Barquisimeto', 'Maracay', 'Ciudad Guayana', 'San Cristóbal', 'Maturín', 'Ciudad Bolívar'
    ]
  },

  // Asia
  {
    code: 'CN',
    name: 'China',
    cities: [
      'Shanghai', 'Beijing', 'Shenzhen', 'Guangzhou', 'Chengdu', 'Nanjing', 'Wuhan', 'Xi\'an', 'Hangzhou',
      'Chongqing', 'Tianjin', 'Shenyang', 'Harbin', 'Suzhou', 'Dongguan', 'Qingdao', 'Dalian', 'Zhengzhou'
    ]
  },
  {
    code: 'IN',
    name: 'India',
    cities: [
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune',
      'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri-Chinchwad'
    ]
  },
  {
    code: 'JP',
    name: 'Japan',
    cities: [
      'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki',
      'Saitama', 'Hiroshima', 'Sendai', 'Kitakyushu', 'Chiba', 'Sakai', 'Niigata', 'Hamamatsu', 'Okayama'
    ]
  },
  {
    code: 'KR',
    name: 'South Korea',
    cities: [
      'Seoul', 'Busan', 'Incheon', 'Daegu', 'Daejeon', 'Gwangju', 'Suwon', 'Ulsan', 'Changwon'
    ]
  },
  {
    code: 'ID',
    name: 'Indonesia',
    cities: [
      'Jakarta', 'Surabaya', 'Bandung', 'Bekasi', 'Medan', 'Tangerang', 'Depok', 'Semarang', 'Palembang'
    ]
  },
  {
    code: 'TH',
    name: 'Thailand',
    cities: [
      'Bangkok', 'Nonthaburi', 'Pak Kret', 'Hat Yai', 'Chiang Mai', 'Phuket', 'Pattaya', 'Udon Thani', 'Nakhon Ratchasima'
    ]
  },
  {
    code: 'VN',
    name: 'Vietnam',
    cities: [
      'Ho Chi Minh City', 'Hanoi', 'Haiphong', 'Da Nang', 'Bien Hoa', 'Hue', 'Nha Trang', 'Can Tho', 'Rach Gia'
    ]
  },
  {
    code: 'PH',
    name: 'Philippines',
    cities: [
      'Manila', 'Quezon City', 'Caloocan', 'Davao', 'Cebu City', 'Zamboanga', 'Antipolo', 'Pasig', 'Taguig'
    ]
  },
  {
    code: 'MY',
    name: 'Malaysia',
    cities: [
      'Kuala Lumpur', 'George Town', 'Ipoh', 'Shah Alam', 'Petaling Jaya', 'Johor Bahru', 'Seremban', 'Kuching', 'Kota Kinabalu'
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    cities: [
      'Singapore'
    ]
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    cities: [
      'Dhaka', 'Chittagong', 'Khulna', 'Rajshahi', 'Sylhet', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla'
    ]
  },
  {
    code: 'PK',
    name: 'Pakistan',
    cities: [
      'Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Gujranwala', 'Peshawar', 'Quetta'
    ]
  },
  {
    code: 'LK',
    name: 'Sri Lanka',
    cities: [
      'Colombo', 'Dehiwala-Mount Lavinia', 'Moratuwa', 'Negombo', 'Kandy', 'Kalmunai', 'Galle', 'Trincomalee', 'Batticaloa'
    ]
  },
  {
    code: 'AF',
    name: 'Afghanistan',
    cities: [
      'Kabul', 'Kandahar', 'Herat', 'Mazar-i-Sharif', 'Jalalabad', 'Kunduz', 'Ghazni', 'Balkh', 'Baghlan'
    ]
  },

  // Oceania
  {
    code: 'AU',
    name: 'Australia',
    cities: [
      'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast'
    ]
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    cities: [
      'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga', 'Napier-Hastings', 'Dunedin', 'Palmerston North', 'Nelson'
    ]
  }
];

export const getCountryByCode = (code: string): Country | undefined => {
  return countriesData.find(country => country.code === code);
};

export const getCountryByName = (name: string): Country | undefined => {
  return countriesData.find(country => country.name === name);
};

export const getCitiesByCountry = (countryName: string): string[] => {
  const country = getCountryByName(countryName);
  return country ? country.cities : [];
};
