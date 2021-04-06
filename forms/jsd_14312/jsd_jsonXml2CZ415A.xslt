<?xml version="1.0"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">

    <xsl:output method="xml" version="1.0" encoding="UTF-8" media-type="xml/text" indent="yes"/>

    <xsl:strip-space elements="*"/>

    <xsl:template match="object[@name='UCD']"/><!-- ignore - not part of record -->
    <xsl:template match="string[@name='$schema']"/><!-- ignore - not part of record -->
    <xsl:template match="string[@name='$comment']"/><!-- ignore - not part of record -->
<!--    <xsl:template match="*[not(node())]"/> &lt;!&ndash; don't include empty nodes &ndash;&gt;-->
    <xsl:template match="*[not(descendant-or-self::*[text()[normalize-space()]])]"/>

    <!-- not used nodes -->
    <xsl:template match="string[@name='TCR07']"/>
    <xsl:template match="string[@name='TCE01']"/>
    <xsl:template match="string[@name='TCE02']"/>
    <xsl:template match="string[@name='TCE03']"/>
    <xsl:template match="string[@name='TCE04']"/>
    <xsl:template match="string[@name='TCE05']"/>


    <xsl:template name="Date_YYYYMMDD">
        <xsl:param name="dt"/>
        <xsl:variable name="yyyy" select="substring($dt, 1, 4)"/>
        <xsl:variable name="MM" select="substring($dt, 6, 2)"/>
        <xsl:variable name="dd" select="substring($dt, 9, 2)"/>

        <xsl:value-of select="concat($yyyy, $MM, $dd)"/>
    </xsl:template>

    <xsl:template name="DateTime_YYYYMMDD_hhmmss">
        <xsl:param name="dt"/>
        <xsl:variable name="yyyy" select="substring($dt, 1, 4)"/>
        <xsl:variable name="MM" select="substring($dt, 6, 2)"/>
        <xsl:variable name="dd" select="substring($dt, 9, 2)"/>
        <xsl:variable name="HH" select="substring($dt, 12, 2)"/>
        <xsl:variable name="mm" select="substring($dt, 15, 2)"/>
        <xsl:variable name="ss" select="substring($dt, 18, 2)"/>

        <xsl:value-of select="concat($yyyy, $MM, $dd, ' ', $HH, $mm, $ss)"/>
    </xsl:template>


    <xsl:template match="/">
        <xsl:apply-templates/>
    </xsl:template>

    <xsl:template match="object[@name='ROOT']">
        <xsl:apply-templates/>
    </xsl:template>

    <xsl:template match="array"> <!-- array is just one by one ater each other -->
        <xsl:apply-templates/>
    </xsl:template>

    <xsl:template match="object">
        <xsl:element name="{@name}">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="string">
        <xsl:element name="{@name}">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="number">
        <xsl:element name="{@name}">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>

    <xsl:template match="datetime[@name='QH68']">
        <xsl:element name="{@name}">
            <xsl:call-template name="Date_YYYYMMDD">
                <xsl:with-param name="dt" select="." />
            </xsl:call-template>
        </xsl:element>
    </xsl:template>

    <xsl:template match="datetime[@name='ODPL03']">
        <xsl:element name="{@name}">
            <xsl:call-template name="Date_YYYYMMDD">
                <xsl:with-param name="dt" select="." />
            </xsl:call-template>
        </xsl:element>
    </xsl:template>

    <xsl:template match="datetime[@name='QGPA02']">
        <xsl:element name="{@name}">
            <xsl:call-template name="Date_YYYYMMDD">
                <xsl:with-param name="dt" select="." />
            </xsl:call-template>
        </xsl:element>
    </xsl:template>

    <xsl:template match="datetime[@name='QPOD01']">
        <xsl:element name="{@name}">
            <xsl:call-template name="DateTime_YYYYMMDD_hhmmss">
                <xsl:with-param name="dt" select="." />
            </xsl:call-template>
        </xsl:element>
    </xsl:template>

    <xsl:template match="boolean[.='true']">
        <xsl:message>boolean - true</xsl:message>
        <xsl:element name="{@name}">1</xsl:element>
    </xsl:template>

    <xsl:template match="boolean[.='false']">
        <xsl:message>boolean - true</xsl:message>
        <xsl:element name="{@name}">0</xsl:element>
    </xsl:template>

</xsl:stylesheet>