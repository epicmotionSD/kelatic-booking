-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 12, 2026 at 12:23 PM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `kelaticc_WPCCF`
--

-- --------------------------------------------------------

--
-- Table structure for table `gzf_amelia_users`
--

CREATE TABLE `gzf_amelia_users` (
  `id` int(11) NOT NULL,
  `status` enum('hidden','visible','disabled','blocked') NOT NULL DEFAULT 'visible',
  `type` enum('customer','provider','manager','admin') NOT NULL,
  `externalId` bigint(20) DEFAULT NULL,
  `firstName` varchar(255) NOT NULL DEFAULT '',
  `lastName` varchar(255) NOT NULL DEFAULT '',
  `email` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `phone` varchar(63) DEFAULT NULL,
  `gender` enum('male','female') DEFAULT NULL,
  `note` text,
  `pictureFullPath` varchar(767) DEFAULT NULL,
  `pictureThumbPath` varchar(767) DEFAULT NULL,
  `password` varchar(128) DEFAULT NULL,
  `usedTokens` text,
  `zoomUserId` varchar(255) DEFAULT NULL,
  `countryPhoneIso` varchar(2) DEFAULT NULL,
  `translations` text,
  `timeZone` varchar(255) DEFAULT NULL,
  `description` text,
  `badgeId` int(11) DEFAULT NULL,
  `stripeConnect` varchar(255) DEFAULT NULL,
  `appleCalendarId` varchar(255) DEFAULT NULL,
  `error` mediumtext
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Dumping data for table `gzf_amelia_users`
--

INSERT INTO `gzf_amelia_users` (`id`, `status`, `type`, `externalId`, `firstName`, `lastName`, `email`, `birthday`, `phone`, `gender`, `note`, `pictureFullPath`, `pictureThumbPath`, `password`, `usedTokens`, `zoomUserId`, `countryPhoneIso`, `translations`, `timeZone`, `description`, `badgeId`, `stripeConnect`, `appleCalendarId`, `error`) VALUES
(1, 'visible', 'provider', NULL, 'Rockal', 'Roberts', 'kelatic@gmail.com', NULL, '+328324526768', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/02/kel.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/02/kel-150x150.jpg', '$2y$10$8U6uXvUEieYBUENo5yxfaePDFbQgg84x6mart23KmCwb0Y9MZUQeO', NULL, NULL, 'be', NULL, NULL, 'The Loc Gawd', 3, NULL, NULL, NULL),
(4, 'visible', 'provider', NULL, 'Shovonna', 'Scott', 'shovonnass@gmail.com', NULL, '+17739307769', NULL, NULL, 'https://kelatichairlounge.com/wp-content/uploads/2021/03/2DCA8D03-8767-4502-B915-616A952AF981.jpeg', 'https://kelatichairlounge.com/wp-content/uploads/2021/03/2DCA8D03-8767-4502-B915-616A952AF981-150x150.jpeg', '$2y$10$ib81GTMyR4osfN4XElTxbuP5BI2cQoExT9xQzqwvvaambvCCBLe8m', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(19, 'hidden', 'provider', NULL, 'Lyndsey', 'Rhea', 'lynzminaj36@gmail.com', NULL, '+812819129648', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/02/lyn.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/02/lyn-150x150.jpg', '$2y$10$rafUmsMQ5/EtP18u9ATDr.fypBSUyl3E1cVVtNVcGPc6ia18Ks8MW', NULL, NULL, 'jp', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(251, 'hidden', 'provider', 243, 'Melly', 'Russell', 'Srussell1223@gmail.com', NULL, '+18626004657', NULL, NULL, 'https://kelatichairlounge.com/wp-content/uploads/2021/05/DEB8319E-316A-49B1-BA9D-9BFDC2A47B22.jpeg', 'https://kelatichairlounge.com/wp-content/uploads/2021/05/DEB8319E-316A-49B1-BA9D-9BFDC2A47B22-150x150.jpeg', '$2y$10$tlch4.SHCCI3n4.WTc6HBOP5KVg6FurBoamhl6.mDui3CRXu5xXPq', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(474, 'hidden', 'provider', NULL, 'Kandace', 'Koated', 'kandacej.2009@gmail.com', NULL, '+18326801524', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/08/image_50744321.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/08/image_50744321-150x150.jpg', '$2y$10$rNZ2abw5fLJ9kGOthoXt..wYLWirKt5iyFntU0Hzpe.carTj10nWK', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(486, 'visible', 'provider', NULL, 'Zora', 'Z', 'hairbyzora@gmail.com', NULL, '+18327449014', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/03/unnamed-scaled.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/03/unnamed-150x150.jpg', '$2y$10$JNzkHjyna3QLgHYjyD7uC.a8PN1re/LgyTxwM6QGK.Jvk1VnG4FPm', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(904, 'visible', 'provider', NULL, 'Kelatic', 'Team', 'hairlounge@kelatic.com', NULL, '', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/03/467AE486-841E-4116-98DA-05C8CF1DE8DA-scaled.jpeg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/03/467AE486-841E-4116-98DA-05C8CF1DE8DA-150x150.jpeg', '$2y$10$MsuEwlLzq52iLQwOgBCDaew7vHlOinjXOrEfvDlXEqyUdgJTNlon6', NULL, NULL, 'us', NULL, NULL, 'We gon do some Locs!', NULL, NULL, NULL, NULL),
(1027, 'hidden', 'provider', NULL, 'Naishon', 'Jones', 'Naishonj@gmail.com', NULL, '+13463415503', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/08/unnamed-1.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/08/unnamed-1-150x150.jpg', '$2y$10$P/r12M7xMH4j1C1kOSg8Dea5gxqxZofCHPGeqzwHvLeLc37.02bmm', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(1072, 'hidden', 'provider', NULL, 'Ashia', 'Brown', 'ashiabrown8@gmail.com', NULL, '', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2023/01/80877E56-CEEB-4805-A14A-76EB86BA22A3-scaled.jpeg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2023/01/80877E56-CEEB-4805-A14A-76EB86BA22A3-150x150.jpeg', '$2y$10$njxhkcmURdijPhqQULesie7JhFixrDeePF74XpCUIeaPhiU9zkJR6', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(1092, 'hidden', 'provider', NULL, 'Nae', 'Kelatic', 'Stitched.nh.1@gmail.com', NULL, '+15594001575', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/10/10AB50BB-52B4-43C3-8831-C8A14D3517BB.jpeg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2022/10/10AB50BB-52B4-43C3-8831-C8A14D3517BB-150x150.jpeg', '$2y$10$SRIsTuvF7ZoqCjU72.VNQeqa1pPse/HgmdrjUkdxJFE/n3TrAWt/i', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(1163, 'hidden', 'provider', NULL, 'Joya', 'Carter', 'business4kelatic@gmail.com', NULL, '', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2023/01/0289CCB4-0A4E-4032-9EEB-3E42186C2435.jpeg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2023/01/0289CCB4-0A4E-4032-9EEB-3E42186C2435-150x150.jpeg', '$2y$10$0DYiZ9yI3b.Kb7L5E80gjuqUC94O/sloV5CeHd.uSo8g71R.ShHBO', NULL, NULL, 'us', NULL, NULL, 'I love doing new Loc styles!', NULL, NULL, NULL, NULL),
(1747, 'hidden', 'provider', NULL, 'Kris', 'Tay', 'Rocrob1x@gmail.com', NULL, '+328324754355', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2023/12/kris.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2023/12/kris-150x150.jpg', '$2y$10$LPSdtp6dh767fY5Dw9gtdO0BBxBZ.Pdg9YyfmkJdHySf9QNjBtKhu', NULL, NULL, 'be', NULL, NULL, 'I vibe with the Locs!', NULL, NULL, NULL, NULL),
(2150, 'hidden', 'provider', NULL, 'Katia', 'Bracey', 'muvabak3z@gmail.com', NULL, '+328328945626', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2024/05/katia1.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2024/05/katia1-150x150.jpg', '$2y$10$wMJ59avMWlIKfo03MnP7p.Jv/2GMR2tUbadeLKun51HeiNP64Klqy', NULL, NULL, 'be', NULL, NULL, 'Lets take this Loc journey together!', NULL, NULL, NULL, NULL),
(2158, 'hidden', 'provider', NULL, 'Falon', 'Francis', 'falon.patrice41@gmail.com', NULL, '+328324936602', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2024/05/IMG_5828.png', 'https://kelatic.com/hair-lounge/wp-content/uploads/2024/05/IMG_5828-150x150.png', '$2y$10$sTTZp17Nv3og22L7Wh8CBukzq88ZWzK47cg7zTu.btvfpegaN4j7m', NULL, NULL, 'be', NULL, NULL, 'Doing Locs brings me peace!', NULL, NULL, NULL, NULL),
(2175, 'visible', 'provider', NULL, 'Kelatic', 'Team', 'hairbykelz.net@gmail.com', NULL, '', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2024/05/LOC-KING.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2024/05/LOC-KING-150x150.jpg', '$2y$10$oTuVMra8jjHJtTp2STkzcuabMkBSljsv/1O/zacBU/VoO6Fqu1/Y.', NULL, NULL, 'us', NULL, NULL, 'Lets get these Locs right!', NULL, NULL, NULL, NULL),
(2507, 'visible', 'provider', NULL, 'Samira', 'Jackson', 'jacksonsamira6@gmail.com', NULL, '+18329702969', NULL, NULL, 'https://kelatic.com/hair-lounge/wp-content/uploads/2025/01/samira-scaled.jpg', 'https://kelatic.com/hair-lounge/wp-content/uploads/2025/01/samira-150x150.jpg', '$2y$10$qHh/c8YS3XKsPczEwbyKW.bdK.luMkUJ2VHVrH3qvwtfd5VpOASUy', NULL, NULL, 'us', NULL, NULL, NULL, NULL, NULL, NULL, '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `gzf_amelia_users`
--
ALTER TABLE `gzf_amelia_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id` (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `gzf_amelia_users`
--
ALTER TABLE `gzf_amelia_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3318;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
