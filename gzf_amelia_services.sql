-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jan 12, 2026 at 12:30 PM
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
-- Table structure for table `gzf_amelia_services`
--

CREATE TABLE `gzf_amelia_services` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL DEFAULT '',
  `description` mediumtext,
  `color` varchar(255) NOT NULL DEFAULT '',
  `price` double NOT NULL,
  `status` enum('hidden','visible','disabled') NOT NULL DEFAULT 'visible',
  `categoryId` int(11) NOT NULL,
  `minCapacity` int(11) NOT NULL,
  `maxCapacity` int(11) NOT NULL,
  `duration` int(11) NOT NULL,
  `timeBefore` int(11) DEFAULT '0',
  `timeAfter` int(11) DEFAULT '0',
  `bringingAnyone` tinyint(1) DEFAULT '1',
  `priority` enum('least_expensive','most_expensive','least_occupied','most_occupied') NOT NULL,
  `pictureFullPath` varchar(767) DEFAULT NULL,
  `pictureThumbPath` varchar(767) DEFAULT NULL,
  `position` int(11) DEFAULT '0',
  `show` tinyint(1) DEFAULT '1',
  `aggregatedPrice` tinyint(1) DEFAULT '1',
  `settings` mediumtext,
  `recurringCycle` enum('disabled','all','daily','weekly','monthly') DEFAULT 'disabled',
  `recurringSub` enum('disabled','past','future','both') DEFAULT 'future',
  `recurringPayment` int(3) DEFAULT '0',
  `translations` text,
  `depositPayment` enum('disabled','fixed','percentage') DEFAULT 'disabled',
  `depositPerPerson` tinyint(1) DEFAULT '1',
  `deposit` double DEFAULT '0',
  `mandatoryExtra` tinyint(1) DEFAULT '0',
  `minSelectedExtras` int(11) DEFAULT '0',
  `fullPayment` tinyint(1) DEFAULT '0',
  `customPricing` text,
  `maxExtraPeople` int(11) DEFAULT NULL,
  `limitPerCustomer` text
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Dumping data for table `gzf_amelia_services`
--

INSERT INTO `gzf_amelia_services` (`id`, `name`) VALUES
(3, 'Retwist w/Braided Plaits'),
(5, '*Style Only*'),
(8, 'Consultaton'),
(9, 'Loc Extentions $2500-$4500'),
(12, 'Retwist-UpDo/Bun'),
(13, 'Tender Heads/Sensitive Loc Retwist'),
(14, 'Half Head Starters $200-$600'),
(15, 'Traditional Starters $300-$600'),
(16, 'Small Starters'),
(17, 'Repairs 6+'),
(18, 'Inner Locking (traditional locs)'),
(19, 'Spirals w/Retwist'),
(34, 'Loc Maintenance'),
(38, 'Micro Starter Retwist'),
(43, 'Short Hair Two Strand'),
(44, 'Retwist-Braided Plaits'),
(47, 'Retwist & Simple Style'),
(62, 'Starter Loc Retwist'),
(63, 'Color Tips of Locs 300-500'),
(65, '**3 Months+ Overdue Retwist**'),
(67, 'Gray Touch-Up'),
(68, 'Micro Locs Retwist $200-$350'),
(69, 'Small Long Hair Starters $500-$1000'),
(70, 'Loc Replacement $25.00'),
(72, 'Shamp/Retwist'),
(73, 'Shamp/Retwist/Simple Style'),
(76, 'Short Hair Two-Strands'),
(77, 'Retwist w/Rope Plaits'),
(78, 'Color Locs/Full Head'),
(79, 'Loc Reconstruction'),
(80, 'Shamp/Retwist'),
(86, '*$hamp/Detox/Retwist*'),
(97, '+(3+ Months Overdue Retwist)'),
(102, 'Long Hair Two Strands'),
(106, 'Deep Conditioning/Retwist/Style'),
(108, 'Deep Conditioning/Retwist Sytle'),
(109, 'Loc Academy Training'),
(112, '+(6+ months over due retwist)'),
(117, 'Starter Locs $300-$900'),
(118, '+Shampoo-Retwist'),
(119, '+Shampoo-Retwist-Style'),
(121, '+Detox Locs'),
(122, '+Tender Head Retwist'),
(129, 'Retwist w/Feed-in Braids'),
(131, 'Small Micro Loc Retwist'),
(132, 'Medium Micro Loc Retwist'),
(133, 'Large Micro Loc Retwist'),
(134, '*Kids Retwist'),
(136, 'Kid Retwist & Style'),
(137, 'Kids Short Hair Two-Strands'),
(138, 'Kids Long Loc Two-Strand'),
(139, 'Kids Detox & Retwist'),
(144, '(StarterLocRetwist)'),
(149, 'Children\'s Consultation Services'),
(150, 'Loc Extensions'),
(151, 'Loc Breakage Consultation'),
(152, 'Micros'),
(153, 'Feed-In Braided Plaits'),
(154, 'Kids Micros'),
(155, 'Tender-Headed Kid'),
(156, 'Starter Loc Consultation'),
(157, 'Inner Locking Consult'),
(158, '****Loc Model Sign-Up****'),
(159, 'Loc Grooming'),
(160, 'Join Waiting List'),
(161, 'Join Waiting List'),
(162, '$75 Shampoo Retwist'),
(163, '75 Wednesday W/Style'),
(164, 'Retwist & Pedals'),
(165, 'Pedals-Fishtails-Updos'),
(166, 'Cut w/Beard'),
(167, 'Full Cut'),
(168, 'Kids Cuts'),
(169, 'Line-Up'),
(171, 'Loc Chop (Tapered Sides)'),
(172, 'Pipe Cleaners'),
(173, 'Micro (Inner Locking) Retie'),
(174, 'Short Hair Two Strands'),
(175, 'Shampoo Retwist w/style');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `gzf_amelia_services`
--
ALTER TABLE `gzf_amelia_services`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `gzf_amelia_services`
--
ALTER TABLE `gzf_amelia_services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=176;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
