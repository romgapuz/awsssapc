import requests
from bs4 import BeautifulSoup
import ref
import utility

def scrape_saps_instances(event, context):
    kwargs = event.get('kwargs')

    # get html page
    r = requests.get('https://aws.amazon.com/sap/instance-types/')

    # initialize
    soup = BeautifulSoup(r.content, 'html.parser')
    data = {}

    # parse table and rows
    divs = soup.find_all('div', attrs={'class':'aws-table'})
    generation = True # first table is the new generation

    for div in divs[:2]:
        rows = div.table.tbody.find_all('tr') # get all rows
        rows.pop(0) # remove header row

        for row in rows:
            # get all columns
            cols = row.find_all('td')

            if cols[3].text == 'N/A':
                continue

            # append data
            data[cols[0].text] = {
                'vcpu': int(cols[1].text.replace('*', '')),
                'mem': float(cols[2].text.replace(',', '')),
                'saps': int(cols[3].text.replace(',', '')),
                'scale_up': (ord(cols[4].text.replace('*', '')) == 10003),
                'scale_out': (ord(cols[5].text.replace('*', '')) == 10003),
                'b1_hana': (ord(cols[6].text.replace('*', '')) == 10003),
                'new': generation
            }

        generation = False # set to previous generation

    # write json to s3
    utility.write_s3_file(kwargs.get('bucket'), 'data/saps_instances.json', data)

def scrape_ondemand_pricing(event, context):
    # get event variables
    kwargs = event.get('kwargs')
    bucket = kwargs.get('bucket')
    pricing_option = 'ondemand'
    operating_system = kwargs.get('operating_system')
    region = kwargs.get('region', None)

    # check if region is selected
    if region is None:
        # loop through regions
        for item in ref.regions:
            od_load_parse_save(item, pricing_option, operating_system)
    else:
        od_load_parse_save(region, pricing_option, operating_system)

def od_load_parse_save(region, pricing_option, operating_system):
    # get pricing for select region
    raw = utility.get_pricing(region, pricing_option, operating_system)

    # parse pricing
    data = utility.parse_ondemand_pricing(raw)

    # write json to S3
    utility.write_s3_file(
        bucket,
        'data/%s/%s/%s.json' % (region, pricing_option, operating_system),
        data
    )

def scrape_reservedinstance_pricing(event, context):
    kwargs = event.get('kwargs')
    bucket = kwargs.get('bucket')
    pricing_option = 'reserved-instance'
    operating_system = kwargs.get('operating_system')
    purchase_option = kwargs.get('purchase_option')
    region = kwargs.get('region', None)

    # check if region is selected
    if region is None:
        # loop through regions
        for item in ref.regions:
            # load, parse and save to S3
            ri_load_parse_save(raw, item, pricing_option, operating_system, purchase_option)
    else:
        # parse and save to S3
        ri_load_parse_save(raw, region, pricing_option, operating_system, purchase_option)

def ri_load_parse_save(raw, region, pricing_option, operating_system, purchase_option):
    data_standard_1yr = {}
    data_standard_3yr = {}
    data_convertible_1yr = {}
    data_convertible_3yr = {}

    # get pricing for select region
    raw = utility.get_pricing(region, pricing_option, operating_system)

    data_standard_1yr_nu,\
    data_standard_3yr_nu,\
    data_convertible_1yr_nu,\
    data_convertible_3yr_nu,\
    data_standard_1yr_pu,\
    data_standard_3yr_pu,\
    data_convertible_1yr_pu,\
    data_convertible_3yr_pu,\
    data_standard_1yr_au,\
    data_standard_3yr_au,\
    data_convertible_1yr_au,\
    data_convertible_3yr_au = utility.parse_reserved_instance_pricing(raw)

    if purchase_option == 'nu':
        data_standard_1yr = data_standard_1yr_nu
        data_standard_3yr = data_standard_3yr_nu
        data_convertible_1yr = data_convertible_1yr_nu
        data_convertible_3yr = data_convertible_3yr_nu
    elif purchase_option == 'pu':
        data_standard_1yr = data_standard_1yr_pu
        data_standard_3yr = data_standard_3yr_pu
        data_convertible_1yr = data_convertible_1yr_pu
        data_convertible_3yr = data_convertible_3yr_pu
    else:
        data_standard_1yr = data_standard_1yr_au
        data_standard_3yr = data_standard_3yr_au
        data_convertible_1yr = data_convertible_1yr_au
        data_convertible_3yr = data_convertible_3yr_au

    utility.write_s3_file(
        bucket,
        'data/%s/%s/%s-standard-1yr-%s.json' % (region, pricing_option, operating_system, purchase_option),
        data_standard_1yr
    )
    utility.write_s3_file(
        bucket,
        'data/%s/%s/%s-standard-3yr-%s.json' % (region, pricing_option, operating_system, purchase_option),
        data_standard_3yr
    )
    utility.write_s3_file(
        bucket,
        'data/%s/%s/%s-convertible-1yr-%s.json' % (region, pricing_option, operating_system, purchase_option),
        data_convertible_1yr
    )
    utility.write_s3_file(
        bucket,
        'data/%s/%s/%s-convertible-3yr-%s.json' % (region, pricing_option, operating_system, purchase_option),
        data_convertible_3yr
    )

def scrape_ondemand_pricing_test(region, operating_system):
    raw = utility.get_pricing(region, 'ondemand', operating_system)
    return utility.parse_ondemand_pricing(raw)

"""
data_standard_1yr_nu,\
data_standard_3yr_nu,\
data_convertible_1yr_nu,\
data_convertible_3yr_nu,\
data_standard_1yr_pu,\
data_standard_3yr_pu,\
data_convertible_1yr_pu,\
data_convertible_3yr_pu,\
data_standard_1yr_au,\
data_standard_3yr_au,\
data_convertible_1yr_au,\
data_convertible_3yr_au = scrape_reservedinstance_pricing_test('eu-west-3', 'suse') 
"""
def scrape_reservedinstance_pricing_test(region, operating_system):
    raw = utility.get_pricing(region, 'reserved-instance', operating_system)
    return utility.parse_reserved_instance_pricing(raw)
