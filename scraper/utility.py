import time
import json
import requests
import boto3
import ref

def get_pricing(region, po, os):
    timestamp = str(time.time()).split('.')[0]
    page = '%s/%s/%s/%s/index.json?timestamp=%s' % (ref.base_url, region, po, os, timestamp)
    r = requests.get(page)
    return json.loads(r.content)

def parse_ondemand_pricing(raw):
    data = {}
    for i in raw['prices']:
        data[i['attributes']['aws:ec2:instanceType']] = {
            'hourly_rate': float(i['price']['USD'])
        }
    return data

def parse_reserved_instance_pricing(raw):
    data_standard_1yr_nu = {}
    data_standard_3yr_nu = {}
    data_convertible_1yr_nu = {}
    data_convertible_3yr_nu = {}
    data_standard_1yr_pu = {}
    data_standard_3yr_pu = {}
    data_convertible_1yr_pu = {}
    data_convertible_3yr_pu = {}
    data_standard_1yr_au = {}
    data_standard_3yr_au = {}
    data_convertible_1yr_au = {}
    data_convertible_3yr_au = {}

    for i in raw['prices']:
        data = {
            'hourly_rate': float(i['price']['USD']),
            'upfront_rate': float(i['calculatedPrice']['upfrontRate']['USD'])
        }

        if i['attributes']['aws:offerTermOfferingClass'] == 'standard':
            if i['attributes']['aws:offerTermLeaseLength'] == '1yr':
                if i['attributes']['aws:offerTermPurchaseOption'] == 'No Upfront':
                    data_standard_1yr_nu[i['attributes']['aws:ec2:instanceType']] = data
                elif i['attributes']['aws:offerTermPurchaseOption'] == 'Partial Upfront':
                    data_standard_1yr_pu[i['attributes']['aws:ec2:instanceType']] = data
                else:
                    data_standard_1yr_au[i['attributes']['aws:ec2:instanceType']] = data
            else:
                if i['attributes']['aws:offerTermPurchaseOption'] == 'No Upfront':
                    data_standard_3yr_nu[i['attributes']['aws:ec2:instanceType']] = data
                elif i['attributes']['aws:offerTermPurchaseOption'] == 'Partial Upfront':
                    data_standard_3yr_pu[i['attributes']['aws:ec2:instanceType']] = data
                else:
                    data_standard_3yr_au[i['attributes']['aws:ec2:instanceType']] = data
        else:
            if i['attributes']['aws:offerTermLeaseLength'] == '1yr':
                if i['attributes']['aws:offerTermPurchaseOption'] == 'No Upfront':
                    data_convertible_1yr_nu[i['attributes']['aws:ec2:instanceType']] = data
                elif i['attributes']['aws:offerTermPurchaseOption'] == 'Partial Upfront':
                    data_convertible_1yr_pu[i['attributes']['aws:ec2:instanceType']] = data
                else:
                    data_convertible_1yr_au[i['attributes']['aws:ec2:instanceType']] = data
            else:
                if i['attributes']['aws:offerTermPurchaseOption'] == 'No Upfront':
                    data_convertible_3yr_nu[i['attributes']['aws:ec2:instanceType']] = data
                elif i['attributes']['aws:offerTermPurchaseOption'] == 'Partial Upfront':
                    data_convertible_3yr_pu[i['attributes']['aws:ec2:instanceType']] = data
                else:
                    data_convertible_3yr_au[i['attributes']['aws:ec2:instanceType']] = data

    return data_standard_1yr_nu,\
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
        data_convertible_3yr_au

def write_s3_file(bucket, filename, content):
    s3 = boto3.resource('s3')
    object = s3.Object(bucket, '%s' % filename)
    object.put(Body=json_minify(content))

def json_minify(raw):
    return json.dumps(raw, separators=(',',':'))
