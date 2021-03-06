EESchema Schematic File Version 4
EELAYER 30 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 2
Title ""
Date ""
Rev ""
Comp ""
Comment1 ""
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
$Comp
L Ninja-qPCR:LM7705MMX_NOPB U2
U 1 1 60883C1C
P 5000 3750
F 0 "U2" H 5500 4037 60  0000 C CNN
F 1 "LM7705MMX_NOPB" H 5500 3931 60  0000 C CNN
F 2 "Ninja-qPCR:LM7705MMX-NOPB" H 5500 3390 60  0001 C CNN
F 3 "" H 5500 3450 60  0000 C CNN
	1    5000 3750
	1    0    0    -1  
$EndComp
$Comp
L Device:C C11
U 1 1 6088469B
P 5500 3250
F 0 "C11" V 5248 3250 50  0000 C CNN
F 1 "4.7uF" V 5339 3250 50  0000 C CNN
F 2 "Capacitors_SMD:C_0603_HandSoldering" H 5538 3100 50  0001 C CNN
F 3 "~" H 5500 3250 50  0001 C CNN
	1    5500 3250
	0    1    1    0   
$EndComp
$Comp
L Device:C C12
U 1 1 60884BE8
P 5500 2800
F 0 "C12" V 5248 2800 50  0000 C CNN
F 1 "DNP" V 5339 2800 50  0000 C CNN
F 2 "Capacitors_SMD:C_1206_HandSoldering" H 5538 2650 50  0001 C CNN
F 3 "~" H 5500 2800 50  0001 C CNN
	1    5500 2800
	0    1    1    0   
$EndComp
$Comp
L power:GND #PWR0102
U 1 1 608869E5
P 4100 4450
F 0 "#PWR0102" H 4100 4200 50  0001 C CNN
F 1 "GND" H 4105 4277 50  0000 C CNN
F 2 "" H 4100 4450 50  0001 C CNN
F 3 "" H 4100 4450 50  0001 C CNN
	1    4100 4450
	1    0    0    -1  
$EndComp
$Comp
L Device:C C9
U 1 1 60886FCB
P 4400 4500
F 0 "C9" H 4285 4454 50  0000 R CNN
F 1 "10uF" H 4285 4545 50  0000 R CNN
F 2 "Capacitors_SMD:C_0805_HandSoldering" H 4438 4350 50  0001 C CNN
F 3 "~" H 4400 4500 50  0001 C CNN
	1    4400 4500
	-1   0    0    1   
$EndComp
$Comp
L Device:C C10
U 1 1 60887854
P 4850 4500
F 0 "C10" H 4735 4454 50  0000 R CNN
F 1 "10uF" H 4735 4545 50  0000 R CNN
F 2 "Capacitors_SMD:C_0805_HandSoldering" H 4888 4350 50  0001 C CNN
F 3 "~" H 4850 4500 50  0001 C CNN
	1    4850 4500
	-1   0    0    1   
$EndComp
$Comp
L power:GND #PWR0103
U 1 1 60887AB3
P 4400 4800
F 0 "#PWR0103" H 4400 4550 50  0001 C CNN
F 1 "GND" H 4405 4627 50  0000 C CNN
F 2 "" H 4400 4800 50  0001 C CNN
F 3 "" H 4400 4800 50  0001 C CNN
	1    4400 4800
	1    0    0    -1  
$EndComp
$Comp
L power:GND #PWR0104
U 1 1 60887F17
P 4850 4800
F 0 "#PWR0104" H 4850 4550 50  0001 C CNN
F 1 "GND" H 4855 4627 50  0000 C CNN
F 2 "" H 4850 4800 50  0001 C CNN
F 3 "" H 4850 4800 50  0001 C CNN
	1    4850 4800
	1    0    0    -1  
$EndComp
Wire Wire Line
	5000 4200 4850 4200
Wire Wire Line
	4400 4200 4400 4350
Wire Wire Line
	4850 4350 4850 4200
Connection ~ 4850 4200
Wire Wire Line
	4850 4200 4400 4200
Wire Wire Line
	4850 4650 4850 4800
Wire Wire Line
	4400 4650 4400 4800
Wire Wire Line
	6000 3750 6150 3750
Wire Wire Line
	6150 3750 6150 3250
Wire Wire Line
	6150 2800 5650 2800
Wire Wire Line
	5000 3750 4850 3750
Wire Wire Line
	4850 3750 4850 3250
Wire Wire Line
	4850 2800 5350 2800
Wire Wire Line
	5350 3250 4850 3250
Connection ~ 4850 3250
Wire Wire Line
	4850 3250 4850 2800
Wire Wire Line
	5650 3250 6150 3250
Connection ~ 6150 3250
Wire Wire Line
	6150 3250 6150 2800
$Comp
L Device:C C14
U 1 1 60892067
P 6500 3500
F 0 "C14" V 6248 3500 50  0000 C CNN
F 1 "DNP" V 6339 3500 50  0000 C CNN
F 2 "Capacitors_SMD:C_1206_HandSoldering" H 6538 3350 50  0001 C CNN
F 3 "~" H 6500 3500 50  0001 C CNN
	1    6500 3500
	0    1    1    0   
$EndComp
$Comp
L Device:C C13
U 1 1 6089262D
P 6500 3900
F 0 "C13" V 6248 3900 50  0000 C CNN
F 1 "4.7uF" V 6339 3900 50  0000 C CNN
F 2 "Capacitors_SMD:C_0603_HandSoldering" H 6538 3750 50  0001 C CNN
F 3 "~" H 6500 3900 50  0001 C CNN
	1    6500 3900
	0    1    1    0   
$EndComp
$Comp
L Device:C C15
U 1 1 6089282D
P 6450 4500
F 0 "C15" H 6335 4454 50  0000 R CNN
F 1 "470nF" H 6335 4545 50  0000 R CNN
F 2 "Capacitors_SMD:C_1206_HandSoldering" H 6488 4350 50  0001 C CNN
F 3 "~" H 6450 4500 50  0001 C CNN
	1    6450 4500
	-1   0    0    1   
$EndComp
$Comp
L Device:C C16
U 1 1 60892C64
P 6900 4500
F 0 "C16" H 6785 4454 50  0000 R CNN
F 1 "22uF" H 6785 4545 50  0000 R CNN
F 2 "Capacitors_SMD:C_0805_HandSoldering" H 6938 4350 50  0001 C CNN
F 3 "~" H 6900 4500 50  0001 C CNN
	1    6900 4500
	-1   0    0    1   
$EndComp
$Comp
L power:GND #PWR0106
U 1 1 6089311B
P 6150 4350
F 0 "#PWR0106" H 6150 4100 50  0001 C CNN
F 1 "GND" H 6155 4177 50  0000 C CNN
F 2 "" H 6150 4350 50  0001 C CNN
F 3 "" H 6150 4350 50  0001 C CNN
	1    6150 4350
	1    0    0    -1  
$EndComp
$Comp
L power:GND #PWR0107
U 1 1 608938B3
P 6450 4800
F 0 "#PWR0107" H 6450 4550 50  0001 C CNN
F 1 "GND" H 6455 4627 50  0000 C CNN
F 2 "" H 6450 4800 50  0001 C CNN
F 3 "" H 6450 4800 50  0001 C CNN
	1    6450 4800
	1    0    0    -1  
$EndComp
$Comp
L power:GND #PWR0108
U 1 1 60893CD7
P 6900 4800
F 0 "#PWR0108" H 6900 4550 50  0001 C CNN
F 1 "GND" H 6905 4627 50  0000 C CNN
F 2 "" H 6900 4800 50  0001 C CNN
F 3 "" H 6900 4800 50  0001 C CNN
	1    6900 4800
	1    0    0    -1  
$EndComp
Wire Wire Line
	6450 4650 6450 4800
Wire Wire Line
	6900 4650 6900 4800
Wire Wire Line
	6900 4050 6450 4050
Wire Wire Line
	6450 4350 6450 4050
Connection ~ 6450 4050
Wire Wire Line
	6450 4050 6000 4050
Wire Wire Line
	6150 4350 6150 4200
Wire Wire Line
	6150 4200 6000 4200
Wire Wire Line
	6350 3500 6250 3500
Wire Wire Line
	6250 3500 6250 3900
Wire Wire Line
	6250 3900 6350 3900
$Comp
L power:GND #PWR0109
U 1 1 60898293
P 6750 3900
F 0 "#PWR0109" H 6750 3650 50  0001 C CNN
F 1 "GND" V 6755 3772 50  0000 R CNN
F 2 "" H 6750 3900 50  0001 C CNN
F 3 "" H 6750 3900 50  0001 C CNN
	1    6750 3900
	0    -1   -1   0   
$EndComp
$Comp
L power:GND #PWR0110
U 1 1 60898A27
P 6750 3500
F 0 "#PWR0110" H 6750 3250 50  0001 C CNN
F 1 "GND" V 6755 3372 50  0000 R CNN
F 2 "" H 6750 3500 50  0001 C CNN
F 3 "" H 6750 3500 50  0001 C CNN
	1    6750 3500
	0    -1   -1   0   
$EndComp
Wire Wire Line
	6250 3900 6000 3900
Connection ~ 6250 3900
Wire Wire Line
	6750 3500 6650 3500
Wire Wire Line
	6750 3900 6650 3900
Wire Wire Line
	6900 4050 6900 4350
$Comp
L Device:C C17
U 1 1 608A650D
P 7350 4500
F 0 "C17" H 7235 4454 50  0000 R CNN
F 1 "DNP" H 7235 4545 50  0000 R CNN
F 2 "Capacitors_SMD:C_1206_HandSoldering" H 7388 4350 50  0001 C CNN
F 3 "~" H 7350 4500 50  0001 C CNN
	1    7350 4500
	-1   0    0    1   
$EndComp
$Comp
L power:GND #PWR0112
U 1 1 608A6517
P 7350 4800
F 0 "#PWR0112" H 7350 4550 50  0001 C CNN
F 1 "GND" H 7355 4627 50  0000 C CNN
F 2 "" H 7350 4800 50  0001 C CNN
F 3 "" H 7350 4800 50  0001 C CNN
	1    7350 4800
	1    0    0    -1  
$EndComp
Wire Wire Line
	7350 4650 7350 4800
Wire Wire Line
	7350 4050 6900 4050
Connection ~ 6900 4050
$Comp
L Device:R FB2
U 1 1 6089C379
P 7700 4150
F 0 "FB2" V 7500 4150 50  0000 C CNN
F 1 "120@100MHz" V 7600 4200 50  0000 C CNN
F 2 "Resistors_SMD:R_0603_HandSoldering" V 7630 4150 50  0001 C CNN
F 3 "~" H 7700 4150 50  0001 C CNN
	1    7700 4150
	0    1    1    0   
$EndComp
Wire Wire Line
	7950 4250 7950 4400
Wire Wire Line
	8100 4250 7950 4250
$Comp
L power:GND #PWR0111
U 1 1 6089A3CB
P 7950 4400
F 0 "#PWR0111" H 7950 4150 50  0001 C CNN
F 1 "GND" H 7955 4227 50  0000 C CNN
F 2 "" H 7950 4400 50  0001 C CNN
F 3 "" H 7950 4400 50  0001 C CNN
	1    7950 4400
	1    0    0    -1  
$EndComp
$Comp
L Connector:Conn_01x03_Male JP2
U 1 1 60899914
P 8300 4150
F 0 "JP2" H 8272 4174 50  0000 R CNN
F 1 "Conn_01x03_Male" H 8272 4083 50  0000 R CNN
F 2 "Pin_Headers:Pin_Header_Straight_1x03_Pitch2.54mm" H 8300 4150 50  0001 C CNN
F 3 "~" H 8300 4150 50  0001 C CNN
	1    8300 4150
	-1   0    0    -1  
$EndComp
Connection ~ 7350 4050
$Comp
L power:GND #PWR0101
U 1 1 60885221
P 4750 3900
F 0 "#PWR0101" H 4750 3650 50  0001 C CNN
F 1 "GND" V 4755 3772 50  0000 R CNN
F 2 "" H 4750 3900 50  0001 C CNN
F 3 "" H 4750 3900 50  0001 C CNN
	1    4750 3900
	0    1    1    0   
$EndComp
Wire Wire Line
	4750 3900 4850 3900
Wire Wire Line
	5000 4050 4850 4050
Wire Wire Line
	4850 4050 4850 3900
Connection ~ 4850 3900
Wire Wire Line
	4850 3900 5000 3900
$Comp
L Connector:Conn_01x02_Male JP3
U 1 1 608ADC53
P 3800 4200
F 0 "JP3" H 3908 4381 50  0000 C CNN
F 1 "Conn_01x02_Male" H 3908 4290 50  0000 C CNN
F 2 "Pin_Headers:Pin_Header_Straight_1x02_Pitch2.54mm" H 3800 4200 50  0001 C CNN
F 3 "~" H 3800 4200 50  0001 C CNN
	1    3800 4200
	1    0    0    -1  
$EndComp
Wire Wire Line
	4000 4300 4100 4300
Wire Wire Line
	4100 4300 4100 4450
Wire Wire Line
	4000 4200 4400 4200
Connection ~ 4400 4200
Wire Wire Line
	7350 4050 7350 4150
Wire Wire Line
	8100 4150 7850 4150
Wire Wire Line
	7550 4150 7350 4150
Connection ~ 7350 4150
Wire Wire Line
	7350 4150 7350 4350
Wire Wire Line
	7350 4050 8100 4050
Text GLabel 4500 4100 2    50   Input ~ 0
VIN
Wire Wire Line
	4500 4100 4400 4100
Wire Wire Line
	4400 4100 4400 4200
$EndSCHEMATC
