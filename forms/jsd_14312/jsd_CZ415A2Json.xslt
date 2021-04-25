<?xml version="1.0"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">

    <xsl:output method="text" encoding="UTF-8" media-type="application/json"/>

    <xsl:strip-space elements="*"/>

    <xsl:template name="date">
        <xsl:param name="value"/>
        <xsl:variable name="yyyy" select="substring($value, 1, 4)"/>
        <xsl:variable name="MM" select="substring($value, 5, 2)"/>
        <xsl:variable name="dd" select="substring($value, 7, 2)"/>

        <xsl:value-of select="concat($yyyy, '-', $MM, '-', $dd)"/>

    </xsl:template>

    <xsl:template name="datetime">
        <xsl:param name="value"/>
        <xsl:variable name="yyyy" select="substring($value, 1, 4)"/>
        <xsl:variable name="MM" select="substring($value, 5, 2)"/>
        <xsl:variable name="dd" select="substring($value, 7, 2)"/>
        <xsl:variable name="HH" select="substring($value, 10, 2)"/>
        <xsl:variable name="mm" select="substring($value, 12, 2)"/>
        <xsl:variable name="ss" select="substring($value, 14, 2)"/>

        <xsl:value-of select="concat($yyyy, '-', $MM, '-', $dd, 'T', $HH, ':', $mm, ':', $ss)"/>
    </xsl:template>

    <xsl:template match="/">
        {
        "$schema": "../forms/jsd_14312/jsd-schema.json",
        <xsl:apply-templates/>
        }
    </xsl:template>

    <!-- objects -->
    <xsl:template match="CZ415A|H|TDKL|REP|COIMP|CCR|COCON|TCR|TCE|DODP|TRAN|RHU|QRHU|TOP|TMAN|ZJP|GU|POPL|ODPL|GZB|GPAMP|GV|GVZB|GVMJ|GPAGMJ|GTCR|GTCE|GKV|GMP|GMJ|GMJZ|QPOD|QPRO">
        "<xsl:value-of select="local-name()"/>": {
        <xsl:apply-templates/>
        }
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>

    <!-- arrays -->
    <xsl:template match="DOPRPR|GH|HP|COSUP|GUF|G|GP|GC|GPA|QGPAP|GPAGMJD|GPD|GPDH|GSM|GCHM|GVOZ|GJPOPL|GMJD">
        "<xsl:value-of select="local-name()"/>": [{
        <xsl:apply-templates/>
        }]
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>

    <!-- strings -->
    <xsl:template match="QH57|H02|H03A|H03B|H04|H06|H09|H16N|H48|H62|H63|H78|DOPRPR01|DOPRPR02|TDKL01|TDKL02|TDKL03|TDKL04|TDKL05|TDKL07|TDKL09|REP01|REP02|REP01N|REP02N|REP03N|REP04N|REP05N|REP07N|COIMP01|CCR01|CCR02|COCON01|TCR01|TCR02|TCR03|TCR04|TCR05|TCR07|TCE01|TCE02|TCE03|TCE04|TCE05|TCE07|TCE08|DODP01|DODP02|TRAN01|RHU01|RHU02|RHU03|RHU07|RHU08|GH01|GH02|GH03|HP01|TOP01|TOP02|TOP03|TOP04|TOP05|TOP07|TMAN01|TMAN02|TMAN03|TMAN04|TMAN05|TMAN07|COSUP01|ZJP01|ZJP02|GU01|GUF01|GUF02|GUF02VS|GUF03|POPL01|ODPL01|ODPL02|G04|G09|G12|G15N|G16N|G17N|G21|G23|G24|G25|G36|G43|GZB01|GZB02|GZB03|GZB04|GZB05|GZB06|GZB07|GZB08|GP01|GP03|GPA01|GPA02|GPA03|GPA04|QGPA03|QGPA07|QGPA08|QGPAP01|GPAMP01|GV12|GV21|GVZB01|GVZB02|GVZB03|GVZB04|GVZB05|GVZB06|GVZB07|GVZB08|GVMJD01|GVMJD03|GVMJD04|GPAGMJ01|GPAGMJ03|GPAGMJD01|GPAGMJD03|GPAGMJD04|GPD01|GPD02|GPD03|GPD04|GPD10|GPD11|GPDH02|GSM01|GSM03|GTCR01|GTCR02|GTCR03|GTCR04|GTCR05|GTCR07|GTCE01|GTCE02|GTCE03|GTCE04|GTCE05|GTCE07|GTCE08|GCHM01|GCHM02|GKV01|GKV03|GVOZ01|GVOZ02|GVOZ03|GJPOPL01|GMP01|GMJ01|GMJ03|GMJD01|GMJD03|GMJD04|GMJZ01|QPRO02">
        "<xsl:value-of select="local-name()"/>": "<xsl:value-of select="."/>"
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>

    <!-- numbers -->
    <xsl:template match="H45|TRAN02|TRAN03|GUF05|G06|G08|G45|QGPA01|QGPA05|QGPA06|GV08|GVMJD02|GPAGMJ02|GPAGMJD02|GKV02|GKV04|GJPOPL02|GMJ02|GMJD02|GMJZ02">
        "<xsl:value-of select="local-name()"/>": <xsl:value-of select="."/>
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>

    <!-- integers -->
    <xsl:template match="H17|H17H|H43|H44|DODP03|TRAN04|GUF04|G01|G13|G14|G27|G34|G38|G39|GP04|GP05|GPA00|QGPA04|QGPA15|QGPAP02|QGPAP03|GV38|GV39|GPD00|GPDH01">
        "<xsl:value-of select="local-name()"/>": <xsl:value-of select="."/>
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>

    <!-- booleans -->
    <xsl:template match="H25|H49|H65|H86|RHU04|G35">
        "<xsl:value-of select="local-name()"/>":
        <xsl:choose>
            <xsl:when test=". = 0">false</xsl:when>
            <xsl:when test=". = 1">true</xsl:when>
        </xsl:choose>
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>

    <!-- dates -->
    <!-- yyyyMMdd HHmmss -->
    <xsl:template match="QPOD01">
        "<xsl:value-of select="local-name()"/>": "#date-time:<xsl:call-template name="datetime"><xsl:with-param name="value" select="."/></xsl:call-template>"
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>

    <!-- yyyMMdd -->
    <xsl:template match="QH68|ODPL03|QGPA02">
        "<xsl:value-of select="local-name()"/>": "#date:<xsl:call-template name="date"><xsl:with-param name="value" select="."/></xsl:call-template>"
        <xsl:if test="position() != last()">,</xsl:if>
    </xsl:template>
</xsl:stylesheet>