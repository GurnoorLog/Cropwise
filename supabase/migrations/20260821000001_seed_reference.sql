-- Reference data seed

insert into public.crop_calendar (crop, crop_hi, sowing_start, sowing_end, harvest_start, harvest_end, region) values
('Rice', 'धान', '2024-06-15', '2024-07-31', '2024-09-15', '2024-11-15', 'India'),
('Maize', 'मक्का', '2024-06-10', '2024-07-20', '2024-09-15', '2024-10-30', 'India'),
('Bajra', 'बाजरा', '2024-07-01', '2024-07-31', '2024-09-15', '2024-10-15', 'India'),
('Jowar', 'ज्वार', '2024-06-15', '2024-07-15', '2024-09-15', '2024-11-15', 'India'),
('Cotton', 'कपास', '2024-05-15', '2024-06-30', '2024-10-15', '2025-01-15', 'India'),
('Soybean', 'सोयाबीन', '2024-06-20', '2024-07-10', '2024-09-25', '2024-10-25', 'India'),
('Groundnut', 'मूंगफली', '2024-06-15', '2024-07-15', '2024-10-01', '2024-11-15', 'India'),
('Tur (Arhar)', 'अरहर', '2024-06-15', '2024-07-15', '2024-11-15', '2025-02-28', 'India'),
('Moong', 'मूंग', '2024-06-25', '2024-07-15', '2024-08-25', '2024-09-30', 'India'),
('Urad', 'उड़द', '2024-06-25', '2024-07-20', '2024-09-25', '2024-10-31', 'India'),
('Sugarcane', 'गन्ना', '2024-10-01', '2024-11-30', '2024-11-01', '2025-03-31', 'India'),
('Wheat', 'गेहूं', '2024-11-01', '2024-12-15', '2025-03-01', '2025-04-15', 'India'),
('Barley', 'जौ', '2024-11-01', '2024-12-15', '2025-03-15', '2025-04-15', 'India'),
('Gram (Chana)', 'चना', '2024-10-15', '2024-11-30', '2025-02-15', '2025-03-31', 'India'),
('Mustard', 'सरसों', '2024-10-01', '2024-11-15', '2025-02-15', '2025-03-31', 'India'),
('Lentil (Masoor)', 'मसूर', '2024-10-25', '2024-11-30', '2025-02-15', '2025-03-20', 'India'),
('Field Pea', 'मटर', '2024-10-15', '2024-11-15', '2025-01-15', '2025-03-15', 'India'),
('Onion', 'प्याज़', '2024-10-15', '2024-11-30', '2025-03-15', '2025-04-30', 'India'),
('Tomato', 'टमाटर', '2024-06-01', '2024-07-15', '2024-08-15', '2024-11-15', 'India'),
('Potato', 'आलू', '2024-10-01', '2024-11-30', '2024-12-15', '2025-02-28', 'India'),
('Chilli', 'मिर्च', '2024-06-01', '2024-07-15', '2024-10-01', '2025-01-31', 'India'),
('Banana', 'केला', '2024-06-01', '2024-07-31', '2025-03-01', '2025-05-31', 'India');

insert into public.msp_rates (crop, crop_hi, price_per_quintal, year, unit) values
('Paddy (Common)', 'धान (सामान्य)', 2300, 2024, '₹/quintal'),
('Paddy (Grade A)', 'धान (ग्रेड A)', 2320, 2024, '₹/quintal'),
('Jowar (Hybrid)', 'ज्वार (संकर)', 3371, 2024, '₹/quintal'),
('Jowar (Maldandi)', 'ज्वार (मालदांडी)', 3421, 2024, '₹/quintal'),
('Bajra', 'बाजरा', 2625, 2024, '₹/quintal'),
('Ragi', 'रागी', 4290, 2024, '₹/quintal'),
('Maize', 'मक्का', 2225, 2024, '₹/quintal'),
('Tur (Arhar)', 'अरहर', 7550, 2024, '₹/quintal'),
('Moong', 'मूंग', 8682, 2024, '₹/quintal'),
('Urad', 'उड़द', 7400, 2024, '₹/quintal'),
('Groundnut', 'मूंगफली', 6783, 2024, '₹/quintal'),
('Sunflower', 'सूरजमुखी', 7720, 2024, '₹/quintal'),
('Soybean', 'सोयाबीन', 4892, 2024, '₹/quintal'),
('Sesamum', 'तिल', 9235, 2024, '₹/quintal'),
('Nigerseed', 'जंगली तिल', 8717, 2024, '₹/quintal'),
('Cotton (Medium Staple)', 'कपास (मध्यम रेशा)', 7121, 2024, '₹/quintal'),
('Cotton (Long Staple)', 'कपास (लंबा रेशा)', 7521, 2024, '₹/quintal'),
('Wheat', 'गेहूं', 2425, 2025, '₹/quintal'),
('Barley', 'जौ', 1985, 2025, '₹/quintal'),
('Gram (Chana)', 'चना', 5650, 2025, '₹/quintal'),
('Masoor', 'मसूर', 6425, 2025, '₹/quintal'),
('Rapeseed & Mustard', 'सरसों', 5950, 2025, '₹/quintal'),
('Safflower', 'कुसुम', 5940, 2025, '₹/quintal'),
('Toria', 'तोरिया', 5500, 2025, '₹/quintal');

insert into public.schemes (name, name_hi, ministry, summary, summary_hi, eligibility, eligibility_hi, apply_url, icon, category) values
(
'PM-KISAN', 'पीएम-किसान',
'Ministry of Agriculture & Farmers Welfare',
'Rs 6,000 per year income support paid directly to landholding farmer families in three equal installments.',
'भूमिधारक किसान परिवारों को Rs 6,000 प्रति वर्ष की आय सहायता, तीन बराबर किश्तों में सीधे बैंक खाते में।',
'All landholding farmer families with cultivable land. Exclusions apply, e.g. income-tax payers and institutional landholders.',
'कृषि योग्य भूमि वाले सभी भूमिधारक किसान परिवार। कुछ अपवाद लागू, जैसे आयकरदाता और संस्थागत भूमिधारक।',
'https://pmkisan.gov.in', 'hand', 'Income'
),
(
'PM Fasal Bima Yojana', 'प्रधानमंत्री फसल बीमा योजना',
'Ministry of Agriculture & Farmers Welfare',
'Crop insurance against natural calamities, pests and diseases. Premium is only 2% for kharif and 1.5% for rabi crops.',
'प्राकृतिक आपदा, कीट और रोग से फसल बीमा। प्रीमियम मात्र 2% (खरीफ) और 1.5% (रबी)।',
'Farmers growing notified crops in notified areas, including sharecroppers and tenant farmers.',
'अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले किसान। बटाईदार और काश्तकार भी शामिल।',
'https://pmfby.gov.in', 'shield', 'Insurance'
),
(
'Kisan Credit Card', 'किसान क्रेडिट कार्ड',
'Department of Financial Services',
'Short-term crop loans up to Rs 3 lakh with interest subvention. Effective rate around 4% with prompt repayment.',
'Rs 3 लाख तक के फसल ऋण पर ब्याज सब्सिडी। समय पर भुगतान पर प्रभावी ब्याज लगभग 4%।',
'Farmers, tenant farmers, oral lessees, SHG and JLG members engaged in crop production.',
'फसल उत्पादन करने वाले किसान, काश्तकार, मौखिक पट्टेदार, SHG और JLG सदस्य।',
'https://www.myscheme.gov.in/schemes/kcc', 'credit', 'Credit'
),
(
'Soil Health Card', 'मृदा स्वास्थ्य कार्ड',
'Ministry of Agriculture & Farmers Welfare',
'Free soil testing with nutrient status and fertiliser recommendations delivered every two years.',
'निःशुल्क मृदा परीक्षण। पोषक तत्वों की स्थिति और उर्वरक सुझाव हर दो साल में।',
'All farmers. Samples are collected based on farm holdings.',
'सभी किसान। नमूने खेत के आधार पर एकत्र किए जाते हैं।',
'https://soilhealth.dac.gov.in', 'droplet', 'Soil'
),
(
'PM-KUSUM Solar Pump', 'पीएम-कुसुम सोलर पंप',
'Ministry of New & Renewable Energy',
'Up to 90% subsidy on standalone and solarised agriculture pumps. Sell surplus power back to the DISCOM.',
'अलग और सोलरीकृत कृषि पंपों पर 90% तक सब्सिडी। अतिरिक्त बिजली DISCOM को बेचें।',
'Individual farmers, FPOs, panchayats and cooperatives for solar pumps up to 7.5 HP.',
'7.5 HP तक के सोलर पंप हेतु किसान, FPO, पंचायत और सहकारी समितियां।',
'https://pmkusum.mnre.gov.in', 'badge', 'Energy'
),
(
'e-NAM Online Mandi', 'ई-नाम ऑनलाइन मंडी',
'Ministry of Agriculture & Farmers Welfare',
'Sell produce online to buyers across 1,400+ integrated mandis with transparent price discovery and direct online payment.',
'1,400+ एकीकृत मंडियों में पारदर्शी कीमत और सीधे ऑनलाइन भुगतान के साथ उपज की बिक्री।',
'Farmers in integrated mandis. Free registration through mobile or the nearest mandi.',
'एकीकृत मंडियों के किसान। मोबाइल या निकटतम मंडी से निःशुल्क पंजीकरण।',
'https://enam.gov.in', 'network', 'Market'
),
(
'Agriculture Infrastructure Fund', 'कृषि अवसंरचना कोष',
'Ministry of Agriculture & Farmers Welfare',
'Medium and long term loans up to Rs 2 crore for warehouses, cold storage and post-harvest infrastructure with 3% interest subvention.',
'गोदाम, कोल्ड स्टोरेज और फसल कटाई-पश्चात ढांचे हेतु Rs 2 करोड़ तक के ऋण पर 3% ब्याज सहायता।',
'Farmers, FPOs, PACS, agri-entrepreneurs and start-ups.',
'किसान, FPO, PACS, कृषि उद्यमी और स्टार्टअप।',
'https://agriinfra.dac.gov.in', 'coins', 'Infrastructure'
),
(
'Paramparagat Krishi Vikas Yojana', 'परम्परागत कृषि विकास योजना',
'Ministry of Agriculture & Farmers Welfare',
'Rs 50,000 per hectare over 3 years for organic inputs and certification, delivered through farmer clusters of 20 hectares.',
'20 हेक्टेयर के किसान समूहों हेतु 3 वर्षों में Rs 50,000 प्रति हेक्टेयर जैविक इनपुट और प्रमाणन सहायता।',
'Farmer clusters of 20 hectares adopting organic practices. Assistance is routed through farmer groups.',
'जैविक खेती अपनाने वाले 20 हेक्टेयर के किसान समूह। सहायता किसान समूहों के माध्यम से दी जाती है।',
'https://pgsindia-ncof.gov.in', 'hand', 'Organic'
),
(
'Farm Machinery Subsidy (SMAM)', 'कृषि यांत्रीकरण सब्सिडी (SMAM)',
'Ministry of Agriculture & Farmers Welfare',
'40 to 50 percent subsidy on tractors, harvesters, drones and machinery. Custom hiring centres get up to 80 percent for groups.',
'ट्रैक्टर, हार्वेस्टर, ड्रोन और मशीनरी पर 40 से 50% सब्सिडी। समूहों के कस्टम हायरिंग सेंटर पर 80% तक।',
'Individual farmers for machinery. Groups, FPOs and cooperatives get higher support for custom hiring centres.',
'व्यक्तिगत किसानों को मशीनरी पर सब्सिडी। समूह, FPO और सहकारी समितियों को कस्टम हायरिंग सेंटर पर अधिक सहायता।',
'https://agrimachinery.nic.in', 'credit', 'Machinery'
),
(
'Horticulture Mission (MIDH)', 'बागवानी मिशन (MIDH)',
'Ministry of Agriculture & Farmers Welfare',
'Support for fruit orchards, vegetables, spices and flowers including quality planting material and micro irrigation.',
'फल, सब्ज़ी, मसाला और फूलों की खेती हेतु गुणवत्तापूर्ण पौध सामग्री और सूक्ष्म सिंचाई सहायता।',
'Horticulture growers. Support of 40 to 50 percent of cost depending on the component.',
'बागवानी करने वाले किसान। घटक के अनुसार 40 से 50% लागत सहायता।',
'https://midh.gov.in', 'droplet', 'Horticulture'
),
(
'National Mission on Edible Oils', 'राष्ट्रीय खाद्य तेल मिशन',
'Ministry of Agriculture & Farmers Welfare',
'Price support and planting assistance for oil palm and oilseed cultivation to reduce import dependence.',
'आयात पर निर्भरता कम करने हेतु ताड़ तेल और तिलहन खेती के लिए मूल्य सहायता और रोपण सहायता।',
'Farmers in notified states undertaking oil palm or oilseed cultivation.',
'अधिसूचित राज्यों में ताड़ या तिलहन उत्पादन करने वाले किसान।',
'https://nmeo.dac.gov.in', 'coins', 'Oilseeds'
),
(
'PM Matsya Sampada Yojana', 'प्रधानमंत्री मत्स्य सम्पदा योजना',
'Ministry of Fisheries, Animal Husbandry & Dairying',
'40 to 60 percent subsidy for fish ponds, cages, hatcheries along with aquaculture insurance support.',
'मछली तालाब, पिंजरे, हैचरी हेतु 40 से 60% सब्सिडी और जलकृषि बीमा सहायता।',
'Fishers, fish farmers, SHGs and fisheries cooperatives.',
'मछुआरे, मत्स्य किसान, SHG और मत्स्य सहकारी समितियां।',
'https://pmmsy.dof.gov.in', 'shield', 'Fisheries'
);
