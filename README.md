# AWS Simple SAP Calculator

Is an free online tool for estimating the cost of running SAP on AWS. Pricing provided are On-Demand and Reserved Instance Standard. Results can be downloaded to a csv file.

See running demo here <http://awsssapc.liveon.cloud/index.html>.

### Assumptions:

- Finding EC2 instance by SAPS will find closest match
- Finding EC2 instance by CPU & RAM will prioritize RAM over CPU

### Components:

- **index.html** - contains the HTML and Javascript code of the calculator. It references to add'l Javascript code under *js* folder.
- **scraper** - is built on *Python* with [Zappa](https://github.com/Miserlou/Zappa) and [Beautiful Soup](https://www.crummy.com/software/BeautifulSoup/).
- **data** - contains *sample* json files for the EC2 On-Demand and Reserved Instance pricing. These files are kept here for reference only and will not be regularly (if ever) updated.