import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
    title: 'Jing Yi Xu Portfolio',
    description: 'Archive and works of Jing Yi Xu',
};


import localFont from 'next/font/local';

const testSoehne = localFont({
    src: [
        // Extra Light
        {
            path: './fonts/test-soehne-extraleicht.woff2',
            weight: '200',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-extraleicht-kursiv.woff2',
            weight: '200',
            style: 'italic',
        },
        // Light
        {
            path: './fonts/test-soehne-leicht.woff2',
            weight: '300',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-leicht-kursiv.woff2',
            weight: '300',
            style: 'italic',
        },
        // Book (Regular)
        {
            path: './fonts/test-soehne-buch.woff2',
            weight: '400',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-buch-kursiv.woff2',
            weight: '400',
            style: 'italic',
        },
        // Halbfett (Medium)
        {
            path: './fonts/test-soehne-halbfett.woff2',
            weight: '500',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-halbfett-kursiv.woff2',
            weight: '500',
            style: 'italic',
        },
        // Dreiviertel (Semi-bold)
        {
            path: './fonts/test-soehne-dreiviertelfett.woff2',
            weight: '600',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-dreiviertelfett-kursiv.woff2',
            weight: '600',
            style: 'italic',
        },
        // Fett (Bold)
        {
            path: './fonts/test-soehne-fett.woff2',
            weight: '700',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-fett-kursiv.woff2',
            weight: '700',
            style: 'italic',
        },
        // Kraftig (Extra Bold)
        {
            path: './fonts/test-soehne-kraftig.woff2',
            weight: '800',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-kraftig-kursiv.woff2',
            weight: '800',
            style: 'italic',
        },
        // Extrafett (Black)
        {
            path: './fonts/test-soehne-extrafett.woff2',
            weight: '900',
            style: 'normal',
        },
        {
            path: './fonts/test-soehne-extrafett-kursiv.woff2',
            weight: '900',
            style: 'italic',
        },
    ],
    variable: '--font-test-soehne',
    display: 'swap',
});

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={testSoehne.variable}>
        <body className={testSoehne.className}>{children}</body>
        </html>
    );
}